import {
  createSession,
  createSessionCookie,
  clearSessionCookie,
  getSessionUser,
  hashPassword,
  revokeSession,
  verifyPassword,
  generateRandomHex,
} from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { Env, User } from '../types'

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON payload', 400)
  }

  const { username, password } = body
  if (!username || !password) {
    return errorResponse('Username and password are required', 400)
  }

  const user = await env.DB.prepare(
    'SELECT id, username, password_hash, salt, full_name, role, is_active FROM users WHERE username = ? COLLATE NOCASE'
  )
    .bind(username.trim())
    .first<{
      id: string
      username: string
      password_hash: string
      salt: string
      full_name: string
      role: User['role']
      is_active: number
    }>()

  if (!user || user.is_active !== 1) {
    return errorResponse('Invalid credentials or account disabled', 401)
  }

  const isValid = await verifyPassword(password, user.salt, user.password_hash)
  if (!isValid) {
    return errorResponse('Invalid credentials', 401)
  }

  const { token, expiresAt } = await createSession(env.DB, user.id)
  const isSecure = new URL(request.url).protocol === 'https:'
  const cookieHeader = createSessionCookie(token, expiresAt, isSecure)

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip')
  await logAudit(env.DB, user.id, 'LOGIN', 'user', user.id, { username: user.username }, ip)

  return jsonResponse(
    {
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
      token, // Also return token for clients that use Authorization header
      expiresAt,
    },
    200,
    { 'Set-Cookie': cookieHeader }
  )
}

export async function handleLogout(request: Request, env: Env, user: User | null): Promise<Response> {
  if (user) {
    await revokeSession(env.DB, request)
    await logAudit(env.DB, user.id, 'LOGOUT', 'user', user.id)
  }

  const isSecure = new URL(request.url).protocol === 'https:'
  const cookieHeader = clearSessionCookie(isSecure)

  return jsonResponse({ message: 'Logged out successfully' }, 200, {
    'Set-Cookie': cookieHeader,
  })
}

export async function handleGetMe(request: Request, env: Env, user: User | null): Promise<Response> {
  if (!user) {
    return errorResponse('Unauthenticated', 401)
  }
  return jsonResponse({ user })
}

export async function handleChangePassword(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON payload', 400)
  }

  const { currentPassword, newPassword } = body
  if (!currentPassword || !newPassword) {
    return errorResponse('Current password and new password are required', 400)
  }

  if (newPassword.length < 8) {
    return errorResponse('New password must be at least 8 characters long', 400)
  }

  const dbUser = await env.DB.prepare(
    'SELECT password_hash, salt FROM users WHERE id = ?'
  )
    .bind(user.id)
    .first<{ password_hash: string; salt: string }>()

  if (!dbUser) return errorResponse('User not found', 404)

  const isValid = await verifyPassword(currentPassword, dbUser.salt, dbUser.password_hash)
  if (!isValid) {
    return errorResponse('Current password does not match', 400)
  }

  const newSalt = generateRandomHex(16)
  const newHash = await hashPassword(newPassword, newSalt)

  await env.DB.prepare(
    'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?'
  )
    .bind(newHash, newSalt, user.id)
    .run()

  await logAudit(env.DB, user.id, 'PASSWORD_CHANGE', 'user', user.id)

  return jsonResponse({ message: 'Password updated successfully' })
}
