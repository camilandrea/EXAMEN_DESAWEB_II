import type { Context } from 'hono'

import { isPrismaErrorCode } from '../lib/prisma-error.js'
import {
  createCategory,
  deleteCategory,
  findAllCategories,
  findCategoryById,
  updateCategory
} from '../repositories/categories.repository.js'
import {
  parseCategoryId,
  validateCreateCategory,
  validateUpdateCategory
} from '../schemas/categories.schema.js'

export async function getCategories(c: Context) {
  const categories = await findAllCategories()

  return c.json(categories)
}

export async function getCategoryById(c: Context) {
  const parsedId = parseCategoryId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  const category = await findCategoryById(parsedId.data)

  if (!category) {
    return c.json({ error: 'Categoria no encontrada' }, 404)
  }

  return c.json(category)
}

export async function postCategory(c: Context) {
  const body = await c.req.json().catch(() => null)
  const validatedBody = validateCreateCategory(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  const category = await createCategory(validatedBody.data)

  return c.json(category, 201)
}

export async function patchCategory(c: Context) {
  const parsedId = parseCategoryId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  const body = await c.req.json().catch(() => null)
  const validatedBody = validateUpdateCategory(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  try {
    const category = await updateCategory(parsedId.data, validatedBody.data)

    return c.json(category)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return c.json({ error: 'Categoria no encontrada' }, 404)
    }

    throw error
  }
}

export async function removeCategory(c: Context) {
  const parsedId = parseCategoryId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  try {
    await deleteCategory(parsedId.data)

    return c.body(null, 204)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return c.json({ error: 'Categoria no encontrada' }, 404)
    }

    if (isPrismaErrorCode(error, 'P2003')) {
      return c.json({ error: 'La categoria tiene transacciones asociadas y no se puede eliminar' }, 400)
    }

    throw error
  }
}
