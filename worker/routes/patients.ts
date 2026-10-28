import { getNextPatientId, jsonResponse, errorResponse, logAudit } from '../db'
import { Env, Patient, User } from '../types'

export async function handleGetPatients(request: Request, env: Env, user: User): Promise<Response> {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')?.trim() || ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '15', 10)))
  const offset = (page - 1) * limit
  const sortBy = url.searchParams.get('sortBy') || 'registration_date'
  const sortOrder = url.searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const allowedSortCols: Record<string, string> = {
    registration_date: 'p.registration_date',
    full_name: 'p.full_name',
    id: 'p.id',
    created_at: 'p.created_at',
  }
  const sortCol = allowedSortCols[sortBy] || 'p.registration_date'

  let whereClause = '1=1'
  const bindings: (string | number)[] = []

  if (search) {
    whereClause += ' AND (p.id LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ?)'
    const wildcard = `%${search}%`
    bindings.push(wildcard, wildcard, wildcard)
  }

  // Count total matching records
  const countStmt = `SELECT COUNT(*) as total FROM patients p WHERE ${whereClause}`
  const countRow = await env.DB.prepare(countStmt).bind(...bindings).first<{ total: number }>()
  const total = countRow ? countRow.total : 0

  // Select page with next and last appointments
  const query = `
    SELECT 
      p.id, p.full_name, p.phone, p.email, p.dob, p.age, p.gender, p.address,
      p.registration_date, p.allergies, p.chief_complaint, p.created_at,
      (SELECT MAX(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date < date('now')) as last_visit,
      (SELECT MIN(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date >= date('now') AND a.status IN ('Scheduled', 'Confirmed')) as next_appointment
    FROM patients p
    WHERE ${whereClause}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `
  bindings.push(limit, offset)

  const { results } = await env.DB.prepare(query).bind(...bindings).all()

  return jsonResponse({
    patients: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function handleCreatePatient(request: Request, env: Env, user: User): Promise<Response> {
  let body: Partial<Patient> & { forceDuplicate?: boolean }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { full_name, phone } = body
  if (!full_name || !full_name.trim()) {
    return errorResponse('Patient full name is required', 400)
  }
  if (!phone || !phone.trim()) {
    return errorResponse('Patient contact phone is required', 400)
  }

  const cleanPhone = phone.trim()

  // Duplicate warning detection by phone number
  if (!body.forceDuplicate) {
    const existing = await env.DB.prepare(
      'SELECT id, full_name, phone, registration_date FROM patients WHERE phone = ?'
    )
      .bind(cleanPhone)
      .first<{ id: string; full_name: string; phone: string; registration_date: string }>()

    if (existing) {
      return jsonResponse(
        {
          warning: 'duplicate_detected',
          message: `A patient with phone ${cleanPhone} already exists (${existing.full_name}, ID: ${existing.id}). Do you still want to proceed?`,
          existingPatient: existing,
        },
        409
      )
    }
  }

  // Generate safe concurrency-safe Patient ID
  const patientId = await getNextPatientId(env.DB)

  // Calculate age if DOB provided
  let calculatedAge = body.age || null
  if (body.dob && !calculatedAge) {
    const birthYear = new Date(body.dob).getFullYear()
    const currentYear = new Date().getFullYear()
    if (!isNaN(birthYear)) {
      calculatedAge = Math.max(0, currentYear - birthYear)
    }
  }

  await env.DB.prepare(
    `INSERT INTO patients (
      id, full_name, phone, email, dob, age, gender, address, emergency_name, emergency_phone,
      registration_date, chief_complaint, medical_history, allergies, medications,
      dental_history, previous_treatments, dentist_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      patientId,
      full_name.trim(),
      cleanPhone,
      body.email?.trim() || null,
      body.dob || null,
      calculatedAge,
      body.gender || null,
      body.address?.trim() || null,
      body.emergency_name?.trim() || null,
      body.emergency_phone?.trim() || null,
      body.chief_complaint?.trim() || null,
      body.medical_history?.trim() || null,
      body.allergies?.trim() || null,
      body.medications?.trim() || null,
      body.dental_history?.trim() || null,
      body.previous_treatments?.trim() || null,
      body.dentist_notes?.trim() || null
    )
    .run()

  await logAudit(env.DB, user.id, 'CREATE_PATIENT', 'patient', patientId, {
    patientId,
    name: full_name.trim(),
    phone: cleanPhone,
  })

  return jsonResponse(
    {
      message: 'Patient registered successfully',
      patientId,
    },
    201
  )
}

export async function handleGetPatient(
  request: Request,
  env: Env,
  user: User,
  patientId: string
): Promise<Response> {
  const patient = await env.DB.prepare('SELECT * FROM patients WHERE id = ?')
    .bind(patientId)
    .first<Patient>()

  if (!patient) {
    return errorResponse('Patient not found', 404)
  }

  // Fetch full clinical and administrative tabs in one request to avoid N+1 queries
  const [appointments, consultations, treatments, payments, followUps] = await Promise.all([
    env.DB.prepare(
      `SELECT a.*, u.full_name as dentist_name 
       FROM appointments a 
       LEFT JOIN users u ON a.dentist_id = u.id 
       WHERE a.patient_id = ? 
       ORDER BY a.appointment_date DESC, a.start_time DESC`
    ).bind(patientId).all(),

    env.DB.prepare(
      `SELECT c.*, u.full_name as dentist_name 
       FROM consultations c 
       LEFT JOIN users u ON c.dentist_id = u.id 
       WHERE c.patient_id = ? 
       ORDER BY c.consultation_date DESC`
    ).bind(patientId).all(),

    env.DB.prepare(
      `SELECT * FROM treatments WHERE patient_id = ? ORDER BY created_at DESC`
    ).bind(patientId).all(),

    env.DB.prepare(
      `SELECT p.*, u.full_name as created_by_name, t.procedure_name
       FROM payments p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN treatments t ON p.treatment_id = t.id
       WHERE p.patient_id = ?
       ORDER BY p.payment_date DESC`
    ).bind(patientId).all(),

    env.DB.prepare(
      `SELECT * FROM follow_ups WHERE patient_id = ? ORDER BY follow_up_date DESC`
    ).bind(patientId).all(),
  ])

  return jsonResponse({
    patient,
    appointments: appointments.results,
    consultations: consultations.results,
    treatments: treatments.results,
    payments: payments.results,
    followUps: followUps.results,
  })
}

export async function handleUpdatePatient(
  request: Request,
  env: Env,
  user: User,
  patientId: string
): Promise<Response> {
  let body: Partial<Patient>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const existing = await env.DB.prepare('SELECT id FROM patients WHERE id = ?')
    .bind(patientId)
    .first()

  if (!existing) {
    return errorResponse('Patient not found', 404)
  }

  // Receptionists are not authorized to edit dentist notes directly
  if (user.role === 'receptionist' && body.dentist_notes !== undefined) {
    return errorResponse('Receptionist role cannot modify dentist clinical notes', 403)
  }

  await env.DB.prepare(
    `UPDATE patients SET 
      full_name = COALESCE(?, full_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      dob = COALESCE(?, dob),
      age = COALESCE(?, age),
      gender = COALESCE(?, gender),
      address = COALESCE(?, address),
      emergency_name = COALESCE(?, emergency_name),
      emergency_phone = COALESCE(?, emergency_phone),
      chief_complaint = COALESCE(?, chief_complaint),
      medical_history = COALESCE(?, medical_history),
      allergies = COALESCE(?, allergies),
      medications = COALESCE(?, medications),
      dental_history = COALESCE(?, dental_history),
      previous_treatments = COALESCE(?, previous_treatments),
      dentist_notes = COALESCE(?, dentist_notes),
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(
      body.full_name?.trim() || null,
      body.phone?.trim() || null,
      body.email?.trim() || null,
      body.dob || null,
      body.age !== undefined ? body.age : null,
      body.gender || null,
      body.address?.trim() || null,
      body.emergency_name?.trim() || null,
      body.emergency_phone?.trim() || null,
      body.chief_complaint?.trim() || null,
      body.medical_history?.trim() || null,
      body.allergies?.trim() || null,
      body.medications?.trim() || null,
      body.dental_history?.trim() || null,
      body.previous_treatments?.trim() || null,
      body.dentist_notes?.trim() || null,
      patientId
    )
    .run()

  await logAudit(env.DB, user.id, 'UPDATE_PATIENT', 'patient', patientId, body)

  return jsonResponse({ message: 'Patient updated successfully' })
}
