export type Category = {
  id: number
  name: string
}

export type CreateCategoryInput = Omit<Category, 'id'>

export type UpdateCategoryInput = Partial<CreateCategoryInput>
