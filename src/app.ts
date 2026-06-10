import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

import { authMiddleware } from './middlewares/auth.middleware.js'
import { authRoutes } from './routes/auth.routes.js'
import { categoriesRoutes } from './routes/categories.routes.js'
import { transactionsRoutes } from './routes/transactions.routes.js'

export const app = new Hono()

app.get('/', (c) => {
  return c.json({
    name: 'Cashi API',
    version: '1.0.0',
    status: 'ok'
  })
})

app.route('/auth', authRoutes)
app.use('/uploads/*', serveStatic({ root: './' }))
app.use('/categories', authMiddleware)
app.use('/categories/*', authMiddleware)
app.use('/transactions', authMiddleware)
app.use('/transactions/*', authMiddleware)
app.route('/transactions', transactionsRoutes)
app.route('/categories', categoriesRoutes)

app.onError((error, c) => {
  console.error(error)

  return c.json({ error: 'Error interno del servidor' }, 500)
})

app.notFound((c) => {
  return c.json({ error: 'Ruta no encontrada' }, 404)
})
