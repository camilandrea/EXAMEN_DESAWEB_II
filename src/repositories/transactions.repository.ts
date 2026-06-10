import { prisma } from '../lib/prisma.js'
import type { CreateTransactionInput, UpdateTransactionInput } from '../types/transaction.js'

export function findAllTransactionsByUser(userId: number) {
  return prisma.transaction.findMany({
    where: {
      userId
    },
    include: {
      category: true
    },
    orderBy: {
      id: 'asc'
    }
  })
}

export function findTransactionById(id: number) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      category: true
    }
  })
}

export function createTransaction(input: CreateTransactionInput, userId: number) {
  return prisma.transaction.create({
    data: {
      ...input,
      userId
    },
    include: {
      category: true
    }
  })
}

export function updateTransaction(id: number, input: UpdateTransactionInput) {
  return prisma.transaction.update({
    where: { id },
    data: input,
    include: {
      category: true
    }
  })
}

export function deleteTransaction(id: number) {
  return prisma.transaction.delete({
    where: { id }
  })
}
