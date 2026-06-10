import type { Context } from 'hono'

import { isPrismaErrorCode } from '../lib/prisma-error.js'
import { getAuthUser } from '../middlewares/auth.middleware.js'
import {
  createTransaction,
  deleteTransaction,
  findAllTransactionsByUser,
  findTransactionById,
  updateTransaction
} from '../repositories/transactions.repository.js'
import {
  parseTransactionId,
  validateCreateTransaction,
  validateUpdateTransaction
} from '../schemas/transactions.schema.js'

export async function getTransactions(c: Context) {
  const user = getAuthUser(c)
  const transactions = await findAllTransactionsByUser(user.id)

  return c.json(transactions)
}

export async function getTransactionById(c: Context) {
  const parsedId = parseTransactionId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  const transaction = await findTransactionById(parsedId.data)

  if (!transaction) {
    return c.json({ error: 'Transaccion no encontrada' }, 404)
  }

  const user = getAuthUser(c)

  if (transaction.userId !== user.id) {
    return c.json({ error: 'No tienes permiso para acceder a esta transaccion' }, 403)
  }

  return c.json(transaction)
}

export async function postTransaction(c: Context) {
  const body = await c.req.json().catch(() => null)
  const validatedBody = validateCreateTransaction(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  try {
    const user = getAuthUser(c)
    const transaction = await createTransaction(validatedBody.data, user.id)

    return c.json(transaction, 201)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2003')) {
      return c.json({ error: 'Categoria no encontrada' }, 400)
    }

    throw error
  }
}

export async function patchTransaction(c: Context) {
  const parsedId = parseTransactionId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  const body = await c.req.json().catch(() => null)
  const validatedBody = validateUpdateTransaction(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  try {
    const currentTransaction = await findTransactionById(parsedId.data)

    if (!currentTransaction) {
      return c.json({ error: 'Transaccion no encontrada' }, 404)
    }

    const user = getAuthUser(c)

    if (currentTransaction.userId !== user.id) {
      return c.json({ error: 'No tienes permiso para modificar esta transaccion' }, 403)
    }

    const transaction = await updateTransaction(parsedId.data, validatedBody.data)

    return c.json(transaction)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return c.json({ error: 'Transaccion no encontrada' }, 404)
    }

    if (isPrismaErrorCode(error, 'P2003')) {
      return c.json({ error: 'Categoria no encontrada' }, 400)
    }

    throw error
  }
}

export async function removeTransaction(c: Context) {
  const parsedId = parseTransactionId(c.req.param('id'))

  if (!parsedId.success) {
    return c.json({ error: parsedId.error }, 400)
  }

  try {
    const currentTransaction = await findTransactionById(parsedId.data)

    if (!currentTransaction) {
      return c.json({ error: 'Transaccion no encontrada' }, 404)
    }

    const user = getAuthUser(c)

    if (currentTransaction.userId !== user.id) {
      return c.json({ error: 'No tienes permiso para eliminar esta transaccion' }, 403)
    }

    await deleteTransaction(parsedId.data)

    return c.body(null, 204)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return c.json({ error: 'Transaccion no encontrada' }, 404)
    }

    throw error
  }
}

export async function getTransactionsBalance(c: Context) {
  const user = getAuthUser(c)
  const transactions = await findAllTransactionsByUser(user.id)
  const balance = transactions.reduce(
    (
      summary: {
        totalIncome: number
        totalExpense: number
        balance: number
      },
      transaction: {
        amount: number
        type: string
      }
    ) => {
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount
      }

      if (transaction.type === 'expense') {
        summary.totalExpense += transaction.amount
      }

      summary.balance = summary.totalIncome - summary.totalExpense

      return summary
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    }
  )

  return c.json(balance)
}
