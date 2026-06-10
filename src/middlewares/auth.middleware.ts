import type { Context, Next } from 'hono'

import { verifyAuthToken } from '../lib/jwt.js'
import type { AuthUser } from '../types/auth.js'

export type AuthVariables = {
  user: AuthUser
}

export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return c.json({ error: 'El token de autorizacion es obligatorio' }, 401)
  }

  const token = authorization.slice('Bearer '.length)

  try {
    const user = verifyAuthToken(token)

    c.set('user', user)

    await next()
  } catch {
    return c.json({ error: 'Token invalido o expirado' }, 401)
  }
}

export function getAuthUser(c: Context): AuthUser {
  return c.get('user')
}
