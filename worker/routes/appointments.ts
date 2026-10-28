import { generateRandomHex } from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { Appointment, Env, User } from '../types'

export async function handleGetAppointments(request: Request, env: Env, user: User): Promise<Response> {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') // YYYY-MM-DD
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const status = url.searchParams.get('status')
  const dentistId = url.searchParams.get('dentistId')
  const patientId = url.searchParams.get('patientId')

  let whereClause = '1=1'
  const bindings: (string | number)[] = []

  if (date) {
    whereClause += ' AND a.appointment_date = ?'
    bindings.push(date)
  } else if (startDate && endDate) {
    whereClause += ' AND a.appointment_date BETWEEN ? AND ?'
    bindings.push(startDate, endDate)
  }

  if (status && status !== 'All') {
    whereClause += ' AND a.status = ?'
    bindings.push(status)
  }

  if (dentistId) {
    whereClause += ' AND a.dentist_id = ?'
    bindings.push(dentistId)
  }

  if (patientId) {
    whereClause += ' AND a.patient_id = ?'
    bindings.push(patientId)
  }

  const query = `
    SELECT 
      a.*, 
      p.full_name as patient_name, 
      p.phone as patient_phone,
      u.full_name as dentist_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u ON a.dentist_id = u.id
    WHERE ${whereClause}
    ORDER BY a.appointment_date ASC, a.start_time ASC
  `

  const { results } = await env.DB.prepare(query).bind(...bindings).all()

  return jsonResponse({ appointments: results })
}

export async function handleCreateAppointment(request: Request, env: Env, user: User): Promise<Response> {
  let body: Partial<Appointment>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { patient_id, appointment_date, start_time, reason } = body
  if (!patient_id || !appointment_date || !start_time || !reason) {
    return errorResponse('Patient, appointment date, start time, and reason are required', 400)
  }

  // Calculate end_time if not provided based on duration
  const duration = body.duration_minutes || 30
  let endTime = body.end_time
  if (!endTime) {
    const [hStr, mStr] = start_time.split(':')
    const totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + duration
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }

  const dentistId = body.dentist_id || (user.role === 'dentist' ? user.id : null)

  // Overlap conflict detection for the dentist
  if (dentistId) {
    const conflict = await env.DB.prepare(
      `SELECT a.id, a.start_time, a.end_time, p.full_name as patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.appointment_date = ? 
         AND a.dentist_id = ? 
         AND a.status NOT IN ('Cancelled')
         AND NOT (a.end_time <= ? OR a.start_time >= ?)`
    )
      .bind(appointment_date, dentistId, start_time, endTime)
      .first<{ id: string; start_time: string; end_time: string; patient_name: string }>()

    if (conflict) {
      return errorResponse(
        `Appointment time conflict: The assigned dentist already has an appointment booked from ${conflict.start_time} to ${conflict.end_time} for ${conflict.patient_name}.`,
        409
      )
    }
  }

  const appointmentId = 'apt-' + generateRandomHex(8)

  await env.DB.prepare(
    `INSERT INTO appointments (
      id, patient_id, dentist_id, appointment_date, start_time, end_time, duration_minutes, reason, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      appointmentId,
      patient_id,
      dentistId,
      appointment_date,
      start_time,
      endTime,
      duration,
      reason.trim(),
      body.status || 'Scheduled',
      body.notes?.trim() || null
    )
    .run()

  await logAudit(env.DB, user.id, 'CREATE_APPOINTMENT', 'appointment', appointmentId, {
    patient_id,
    appointment_date,
    start_time,
    endTime,
  })

  return jsonResponse({ message: 'Appointment scheduled successfully', appointmentId }, 201)
}

export async function handleUpdateAppointment(
  request: Request,
  env: Env,
  user: User,
  appointmentId: string
): Promise<Response> {
  let body: Partial<Appointment>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const existing = await env.DB.prepare('SELECT * FROM appointments WHERE id = ?')
    .bind(appointmentId)
    .first<Appointment>()

  if (!existing) {
    return errorResponse('Appointment not found', 404)
  }

  // Conflict check if time or date is being rescheduled
  const newDate = body.appointment_date || existing.appointment_date
  const newStart = body.start_time || existing.start_time
  const newEnd = body.end_time || existing.end_time
  const dentistId = body.dentist_id !== undefined ? body.dentist_id : existing.dentist_id

  if ((body.start_time || body.appointment_date || body.end_time) && dentistId) {
    const conflict = await env.DB.prepare(
      `SELECT a.id, a.start_time, a.end_time, p.full_name as patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id != ?
         AND a.appointment_date = ? 
         AND a.dentist_id = ? 
         AND a.status NOT IN ('Cancelled')
         AND NOT (a.end_time <= ? OR a.start_time >= ?)`
    )
      .bind(appointmentId, newDate, dentistId, newStart, newEnd)
      .first<{ id: string; start_time: string; end_time: string; patient_name: string }>()

    if (conflict) {
      return errorResponse(
        `Time conflict: Dentist already has an appointment booked from ${conflict.start_time} to ${conflict.end_time} for ${conflict.patient_name}.`,
        409
      )
    }
  }

  await env.DB.prepare(
    `UPDATE appointments SET
      dentist_id = COALESCE(?, dentist_id),
      appointment_date = COALESCE(?, appointment_date),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      duration_minutes = COALESCE(?, duration_minutes),
      reason = COALESCE(?, reason),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(
      body.dentist_id !== undefined ? body.dentist_id : null,
      body.appointment_date || null,
      body.start_time || null,
      body.end_time || null,
      body.duration_minutes || null,
      body.reason || null,
      body.status || null,
      body.notes || null,
      appointmentId
    )
    .run()

  await logAudit(env.DB, user.id, 'UPDATE_APPOINTMENT', 'appointment', appointmentId, body)

  return jsonResponse({ message: 'Appointment updated successfully' })
}
