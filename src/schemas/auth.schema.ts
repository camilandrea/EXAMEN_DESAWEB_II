import { z } from 'zod'

import type { AuthInput } from '../types/auth.js'

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const authSchema = z.object({
  email: z.string().trim().email('El email debe ser valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres')
})

export function validateAuthInput(body: unknown): ValidationResult<AuthInput> {
  const result = authSchema.safeParse(body)

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Datos de autenticacion invalidos' }
  }

  return { success: true, data: result.data }
}
