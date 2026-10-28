import { Env, User, UserRole } from './types'

// PBKDF2 Constants
const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEYLEN = 32 // 256 bits
const SESSION_DURATION_HOURS = 24 * 7 // 7 days

/**
 * Convert buffer to hex string
 */
export function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Generate cryptographically secure random hex string
 */
export function generateRandomHex(byteCount = 16): string {
  const bytes = new Uint8Array(byteCount)
  crypto.getRandomValues(bytes)
  return bufToHex(bytes.buffer)
}

/**
 * Hash password with PBKDF2 via Web Crypto API
 */
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltHex) as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    PBKDF2_KEYLEN * 8
  )

  return bufToHex(derivedBits)
}

/**
 * Verify plaintext password against stored salt and hash using timing-safe comparison
 */
export async function verifyPassword(password: string, saltHex: string, expectedHash: string): Promise<boolean> {
  const computedHash = await hashPassword(password, saltHex)
  if (computedHash.length !== expectedHash.length) return false
  
  let match = 0
  for (let i = 0; i < computedHash.length; i++) {
    match |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  return match === 0
}

/**
 * Compute SHA-256 hash of a session token
 */
export async function hashToken(token: string): Promise<string> {
  const enc = new TextEncoder()
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(token))
  return bufToHex(hashBuf)
}

/**
 * Create a new session in D1
 */
export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = generateRandomHex(32) // 256 bits of entropy
  const tokenHash = await hashToken(token)
  const sessionId = 'ses_' + generateRandomHex(12)
  
  const expiresDate = new Date(Date.now() + SESSION_DURATION_HOURS * 3600 * 1000)
  const expiresAt = expiresDate.toISOString()

  await db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(sessionId, userId, tokenHash, expiresAt).run()

  return { token, expiresAt }
}

/**
 * Extract token from Cookie or Authorization header
 */
export function extractToken(request: Request): string | null {
  // 1. Try Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim()
  }

  // 2. Try Cookie
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';')
    for (const cookie of cookies) {
      const [key, val] = cookie.trim().split('=')
      if (key === 'dac_session' && val) {
        return decodeURIComponent(val)
      }
    }
  }

  return null
}

/**
 * Authenticate session and retrieve User from D1
 */
export async function getSessionUser(db: D1Database, request: Request): Promise<User | null> {
  const token = extractToken(request)
  if (!token) return null

  const tokenHash = await hashToken(token)

  const row = await db.prepare(
    `SELECT u.id, u.username, u.full_name, u.role, u.phone, u.email, u.is_active, u.created_at, s.expires_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
  ).bind(tokenHash).first<{
    id: string
    username: string
    full_name: string
    role: UserRole
    phone: string | null
    email: string | null
    is_active: number
    created_at: string
    expires_at: string
  }>()

  if (!row) return null

  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone,
    email: row.email,
    is_active: row.is_active,
    created_at: row.created_at,
  }
}

/**
 * Revoke/delete the current session
 */
export async function revokeSession(db: D1Database, request: Request): Promise<void> {
  const token = extractToken(request)
  if (!token) return
  const tokenHash = await hashToken(token)
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run()
}

/**
 * Generate Set-Cookie header string
 */
export function createSessionCookie(token: string, expiresAt: string, isSecure = true): string {
  const maxAge = SESSION_DURATION_HOURS * 3600
  let cookie = `dac_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
  if (isSecure) {
    cookie += '; Secure'
  }
  return cookie
}

/**
 * Generate clearing Set-Cookie header
 */
export function clearSessionCookie(isSecure = true): string {
  let cookie = `dac_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  if (isSecure) {
    cookie += '; Secure'
  }
  return cookie
}

/**
 * Validate CSRF for state-changing requests when authenticated via cookie
 */
export function validateCsrf(request: Request): boolean {
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true

  // Check custom header or origin
  const customHeader = request.headers.get('X-Requested-With') || request.headers.get('X-CSRF-Protection')
  if (customHeader) return true

  const origin = request.headers.get('Origin')
  const host = request.headers.get('Host')
  if (origin && host) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host === host) return true
    } catch {
      return false
    }
  }

  // If Authorization bearer is used, CSRF is not applicable
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return true
  }

  return false
}
