import { generateRandomHex } from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { Consultation, Env, User } from '../types'

export async function handleGetConsultations(request: Request, env: Env, user: User): Promise<Response> {
  const url = new URL(request.url)
  const patientId = url.searchParams.get('patientId')
  const dentistId = url.searchParams.get('dentistId')

  let whereClause = '1=1'
  const bindings: string[] = []

  if (patientId) {
    whereClause += ' AND c.patient_id = ?'
    bindings.push(patientId)
  }
  if (dentistId) {
    whereClause += ' AND c.dentist_id = ?'
    bindings.push(dentistId)
  }

  const query = `
    SELECT 
      c.*,
      p.full_name as patient_name,
      p.phone as patient_phone,
      u.full_name as dentist_name
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    JOIN users u ON c.dentist_id = u.id
    WHERE ${whereClause}
    ORDER BY c.consultation_date DESC, c.created_at DESC
  `

  const { results } = await env.DB.prepare(query).bind(...bindings).all()
  return jsonResponse({ consultations: results })
}

export async function handleCreateConsultation(request: Request, env: Env, user: User): Promise<Response> {
  // Only dentists and admins can record clinical consultations
  if (user.role === 'receptionist') {
    return errorResponse('Receptionist role cannot author clinical consultations', 403)
  }

  let body: Partial<Consultation>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { patient_id, diagnosis } = body
  if (!patient_id || !diagnosis || !diagnosis.trim()) {
    return errorResponse('Patient and clinical diagnosis are required', 400)
  }

  const consultationId = 'con-' + generateRandomHex(8)
  const dentistId = user.role === 'dentist' ? user.id : (body.dentist_id || user.id)

  await env.DB.prepare(
    `INSERT INTO consultations (
      id, patient_id, dentist_id, consultation_date, chief_complaint, clinical_observations,
      examination_notes, diagnosis, treatment_recommendation, prescription_notes,
      follow_up_recommendation, next_review_date, created_at
    ) VALUES (?, ?, ?, COALESCE(?, date('now')), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      consultationId,
      patient_id,
      dentistId,
      body.consultation_date || null,
      body.chief_complaint?.trim() || null,
      body.clinical_observations?.trim() || null,
      body.examination_notes?.trim() || null,
      diagnosis.trim(),
      body.treatment_recommendation?.trim() || null,
      body.prescription_notes?.trim() || null,
      body.follow_up_recommendation?.trim() || null,
      body.next_review_date || null
    )
    .run()

  // If next_review_date is provided, automatically create a linked follow_up
  if (body.next_review_date) {
    const followUpId = 'fol-' + generateRandomHex(8)
    await env.DB.prepare(
      `INSERT INTO follow_ups (
        id, patient_id, consultation_id, follow_up_date, reason, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, datetime('now'), datetime('now'))`
    )
      .bind(
        followUpId,
        patient_id,
        consultationId,
        body.next_review_date,
        body.follow_up_recommendation || 'Consultation follow-up review',
        'Auto-created from consultation'
      )
      .run()
  }

  await logAudit(env.DB, user.id, 'CREATE_CONSULTATION', 'consultation', consultationId, {
    patient_id,
    diagnosis,
  })

  return jsonResponse({ message: 'Consultation recorded successfully', consultationId }, 201)
}
