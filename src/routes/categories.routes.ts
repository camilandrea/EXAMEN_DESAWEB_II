import { Hono } from 'hono'

import {
  getCategories,
  getCategoryById,
  patchCategory,
  postCategory,
  removeCategory
} from '../controllers/categories.controller.js'

export const categoriesRoutes = new Hono()

categoriesRoutes.get('/', getCategories)
categoriesRoutes.get('/:id', getCategoryById)
categoriesRoutes.post('/', postCategory)
categoriesRoutes.patch('/:id', patchCategory)
categoriesRoutes.delete('/:id', removeCategory)
