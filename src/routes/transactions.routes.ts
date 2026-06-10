import { Hono } from 'hono'

import {
  getTransactionById,
  getTransactions,
  getTransactionsBalance,
  postTransaction,
  patchTransaction,
  removeTransaction
} from '../controllers/transactions.controller.js'
import { uploadReceipt } from '../controllers/uploads.controller.js'

export const transactionsRoutes = new Hono()

transactionsRoutes.get('/', getTransactions)
transactionsRoutes.get('/balance', getTransactionsBalance)
transactionsRoutes.post('/upload', uploadReceipt)
transactionsRoutes.get('/:id', getTransactionById)
transactionsRoutes.post('/', postTransaction)
transactionsRoutes.patch('/:id', patchTransaction)
transactionsRoutes.delete('/:id', removeTransaction)
