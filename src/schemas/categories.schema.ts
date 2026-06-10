import { z } from 'zod'

import type { CreateCategoryInput, UpdateCategoryInput } from '../types/category.js'

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio')
})

const updateCategorySchema = createCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Debes enviar al menos un campo valido'
)

export function parseCategoryId(rawId: string | undefined): ValidationResult<number> {
  if (!rawId) {
    return { success: false, error: 'El id de la categoria es obligatorio' }
  }

  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: 'El id de la categoria debe ser un entero positivo' }
  }

  return { success: true, data: id }
}

export function validateCreateCategory(body: unknown): ValidationResult<CreateCategoryInput> {
  const result = createCategorySchema.safeParse(body)

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Datos de categoria invalidos' }
  }

  return { success: true, data: result.data }
}

export function validateUpdateCategory(body: unknown): ValidationResult<UpdateCategoryInput> {
  const result = updateCategorySchema.safeParse(body)

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Datos de categoria invalidos' }
  }

  return { success: true, data: result.data }
}
