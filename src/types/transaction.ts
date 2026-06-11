export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: number
  amount: number
  type: TransactionType
  description: string | null
  date: Date
  receiptUrl: string | null
  latitude: number | null
  longitude: number | null
  categoryId: number
  userId: number
}
