import bcrypt from 'bcryptjs'
import type { Context } from 'hono'

import { signAuthToken } from '../lib/jwt.js'
import { isPrismaErrorCode } from '../lib/prisma-error.js'
import { createUser, findUserByEmail } from '../repositories/users.repository.js'
import { validateAuthInput } from '../schemas/auth.schema.js'

export async function register(c: Context) {
  const body = await c.req.json().catch(() => null)
  const validatedBody = validateAuthInput(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  const passwordHash = await bcrypt.hash(validatedBody.data.password, 10)

  try {
    const user = await createUser(validatedBody.data.email, passwordHash)
    const token = signAuthToken({
      id: user.id,
      email: user.email
    })

    return c.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      },
      201
    )
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2002')) {
      return c.json({ error: 'El email ya esta registrado' }, 400)
    }

    throw error
  }
}

export async function login(c: Context) {
  const body = await c.req.json().catch(() => null)
  const validatedBody = validateAuthInput(body)

  if (!validatedBody.success) {
    return c.json({ error: validatedBody.error }, 400)
  }

  const user = await findUserByEmail(validatedBody.data.email)

  if (!user) {
    return c.json({ error: 'Credenciales invalidas' }, 401)
  }

  const passwordMatches = await bcrypt.compare(validatedBody.data.password, user.passwordHash)

  if (!passwordMatches) {
    return c.json({ error: 'Credenciales invalidas' }, 401)
  }

  const token = signAuthToken({
    id: user.id,
    email: user.email
  })

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email
    }
  })
}
