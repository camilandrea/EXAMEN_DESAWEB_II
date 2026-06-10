import jwt from 'jsonwebtoken'

import type { AuthUser } from '../types/auth.js'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET es obligatorio')
  }

  return secret
}

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(user, getJwtSecret(), {
    expiresIn: '1d'
  })
}

export function verifyAuthToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret())

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.id !== 'number' ||
    typeof payload.email !== 'string'
  ) {
    throw new Error('Payload del token invalido')
  }

  return {
    id: payload.id,
    email: payload.email
  }
}
