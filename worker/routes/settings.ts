import { generateRandomHex, hashPassword } from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { ClinicSettings, Env, User, UserRole } from '../types'

export async function handleGetSettings(request: Request, env: Env, user: User): Promise<Response> {
  const settings = await env.DB.prepare(
    'SELECT * FROM clinic_settings WHERE id = ?'
  ).bind('default').first<ClinicSettings>()

  let treatmentOptions = []
  if (settings?.treatment_options) {
    try {
      treatmentOptions = JSON.parse(settings.treatment_options)
    } catch {
      treatmentOptions = []
    }
  }

  return jsonResponse({
    settings: {
      ...settings,
      treatmentOptions,
    },
  })
}

export async function handleUpdateSettings(request: Request, env: Env, user: User): Promise<Response> {
  if (user.role !== 'admin') {
    return errorResponse('Only clinic admin can modify settings', 403)
  }

  let body: Partial<ClinicSettings> & { treatmentOptions?: unknown }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  let treatmentOptionsStr: string | null = null
  if (body.treatmentOptions) {
    treatmentOptionsStr = JSON.stringify(body.treatmentOptions)
  }

  await env.DB.prepare(
    `UPDATE clinic_settings SET
      clinic_name = COALESCE(?, clinic_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      default_appointment_duration = COALESCE(?, default_appointment_duration),
      treatment_options = COALESCE(?, treatment_options),
      updated_at = datetime('now')
    WHERE id = 'default'`
  )
    .bind(
      body.clinic_name || null,
      body.phone || null,
      body.email || null,
      body.address || null,
      body.default_appointment_duration || null,
      treatmentOptionsStr
    )
    .run()

  await logAudit(env.DB, user.id, 'UPDATE_SETTINGS', 'clinic_settings', 'default', body)

  return jsonResponse({ message: 'Clinic settings updated successfully' })
}

export async function handleGetUsers(request: Request, env: Env, user: User): Promise<Response> {
  if (user.role !== 'admin') {
    return errorResponse('Only clinic admin can view staff list', 403)
  }

  const { results } = await env.DB.prepare(
    'SELECT id, username, full_name, role, phone, email, is_active, created_at FROM users ORDER BY created_at ASC'
  ).all()

  return jsonResponse({ users: results })
}

export async function handleCreateUser(request: Request, env: Env, user: User): Promise<Response> {
  if (user.role !== 'admin') {
    return errorResponse('Only clinic admin can add staff accounts', 403)
  }

  let body: {
    username: string
    password: string
    full_name: string
    role: UserRole
    phone?: string
    email?: string
  }

  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { username, password, full_name, role } = body
  if (!username || !password || !full_name || !role) {
    return errorResponse('Username, password, full name, and role are required', 400)
  }

  if (password.length < 8) {
    return errorResponse('Password must be at least 8 characters long', 400)
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .bind(username.trim())
    .first()

  if (existing) {
    return errorResponse(`Username '${username}' is already taken`, 409)
  }

  const salt = generateRandomHex(16)
  const passwordHash = await hashPassword(password, salt)
  const newUserId = 'user_' + generateRandomHex(8)

  await env.DB.prepare(
    `INSERT INTO users (id, username, password_hash, salt, full_name, role, phone, email, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  )
    .bind(
      newUserId,
      username.trim(),
      passwordHash,
      salt,
      full_name.trim(),
      role,
      body.phone?.trim() || null,
      body.email?.trim() || null
    )
    .run()

  await logAudit(env.DB, user.id, 'CREATE_USER', 'user', newUserId, { username, role })

  return jsonResponse({ message: 'Staff user created successfully', userId: newUserId }, 201)
}
