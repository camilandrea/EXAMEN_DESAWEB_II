import { prisma } from '../lib/prisma.js'
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/categories.schema.js'

export function findAllCategories() {
  return prisma.category.findMany({
    orderBy: {
      id: 'asc'
    }
  })
}

export function findCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id }
  })
}

export function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: input
  })
}

export function updateCategory(id: number, input: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data: input
  })
}

export function deleteCategory(id: number) {
  return prisma.category.delete({
    where: { id }
  })
}
