import { z } from 'zod'

import type { CreateTransactionInput, UpdateTransactionInput } from '../types/transaction.js'

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const createTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser un numero positivo'),
  type: z.enum(['income', 'expense']),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  receiptUrl: z.string().url('La URL del comprobante debe ser valida').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  categoryId: z.number().int().positive('El id de la categoria debe ser un entero positivo')
})

const updateTransactionSchema = createTransactionSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Debes enviar al menos un campo valido'
)

export function parseTransactionId(rawId: string | undefined): ValidationResult<number> {
  if (!rawId) {
    return { success: false, error: 'El id de la transaccion es obligatorio' }
  }

  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: 'El id de la transaccion debe ser un entero positivo' }
  }

  return { success: true, data: id }
}

export function validateCreateTransaction(body: unknown): ValidationResult<CreateTransactionInput> {
  const result = createTransactionSchema.safeParse(body)

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Datos de transaccion invalidos' }
  }

  return { success: true, data: result.data }
}

export function validateUpdateTransaction(body: unknown): ValidationResult<UpdateTransactionInput> {
  const result = updateTransactionSchema.safeParse(body)

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Datos de transaccion invalidos' }
  }

  return { success: true, data: result.data }
}
