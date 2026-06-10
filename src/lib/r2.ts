import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

type R2Config = {
  bucketName: string
  publicBaseUrl: string
  receiptsPrefix: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`La variable ${name} es obligatoria`)
  }

  return value
}

export function getR2Config(): R2Config {
  return {
    bucketName: getRequiredEnv('R2_BUCKET_NAME'),
    publicBaseUrl: getRequiredEnv('R2_PUBLIC_BASE_URL').replace(/\/$/, ''),
    receiptsPrefix: process.env.R2_RECEIPTS_PREFIX ?? 'receipts'
  }
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: getRequiredEnv('R2_ENDPOINT'),
  credentials: {
    accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY')
  }
})

export async function uploadReceiptToR2(input: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  const config = getR2Config()

  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType
    })
  )

  return `${config.publicBaseUrl}/${input.key}`
}
