import { extname } from 'node:path'
import { randomUUID } from 'node:crypto'

import type { Context } from 'hono'

import { getR2Config, uploadReceiptToR2 } from '../lib/r2.js'

const maxReceiptSize = 5 * 1024 * 1024
const allowedReceiptTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
])

export async function uploadReceipt(c: Context) {
  const body = await c.req.parseBody()
  const receipt = body.receipt

  if (!(receipt instanceof File)) {
    return c.json({ error: 'El archivo del comprobante es obligatorio' }, 400)
  }

  if (!allowedReceiptTypes.has(receipt.type)) {
    return c.json({ error: 'El comprobante debe ser una imagen JPEG, PNG o WebP' }, 400)
  }

  if (receipt.size > maxReceiptSize) {
    return c.json({ error: 'El comprobante debe pesar 5 MB o menos' }, 400)
  }

  const fallbackExtension = allowedReceiptTypes.get(receipt.type) ?? '.jpg'
  const originalExtension = extname(receipt.name)
  const extension = originalExtension || fallbackExtension
  const fileName = `${randomUUID()}${extension}`
  const { receiptsPrefix } = getR2Config()
  const key = `${receiptsPrefix.replace(/\/$/, '')}/${fileName}`

  const receiptUrl = await uploadReceiptToR2({
    key,
    body: Buffer.from(await receipt.arrayBuffer()),
    contentType: receipt.type
  })

  return c.json({
    receiptUrl
  })
}
