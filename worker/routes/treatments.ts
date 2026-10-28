import { generateRandomHex } from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { Env, Treatment, User } from '../types'

export async function handleGetTreatments(request: Request, env: Env, user: User): Promise<Response> {
  const url = new URL(request.url)
  const patientId = url.searchParams.get('patientId')
  const status = url.searchParams.get('status')

  let whereClause = '1=1'
  const bindings: string[] = []

  if (patientId) {
    whereClause += ' AND t.patient_id = ?'
    bindings.push(patientId)
  }
  if (status && status !== 'All') {
    whereClause += ' AND t.status = ?'
    bindings.push(status)
  }

  const query = `
    SELECT 
      t.*,
      p.full_name as patient_name,
      p.phone as patient_phone
    FROM treatments t
    JOIN patients p ON t.patient_id = p.id
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
  `

  const { results } = await env.DB.prepare(query).bind(...bindings).all()
  return jsonResponse({ treatments: results })
}

export async function handleCreateTreatment(request: Request, env: Env, user: User): Promise<Response> {
  let body: Partial<Treatment>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { patient_id, procedure_name } = body
  if (!patient_id || !procedure_name || !procedure_name.trim()) {
    return errorResponse('Patient and procedure name are required', 400)
  }

  const treatmentId = 'trt-' + generateRandomHex(8)
  const estimatedCost = Math.max(0, Math.round(Number(body.estimated_cost_paise) || 0))
  const actualCost = Math.max(0, Math.round(Number(body.actual_cost_paise) || estimatedCost))

  await env.DB.prepare(
    `INSERT INTO treatments (
      id, patient_id, consultation_id, procedure_name, tooth_number, description,
      estimated_cost_paise, actual_cost_paise, status, start_date, completion_date, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      treatmentId,
      patient_id,
      body.consultation_id || null,
      procedure_name.trim(),
      body.tooth_number?.trim() || null,
      body.description?.trim() || null,
      estimatedCost,
      actualCost,
      body.status || 'Planned',
      body.start_date || (body.status === 'In progress' ? new Date().toISOString().split('T')[0] : null),
      body.completion_date || (body.status === 'Completed' ? new Date().toISOString().split('T')[0] : null),
      body.notes?.trim() || null
    )
    .run()

  await logAudit(env.DB, user.id, 'CREATE_TREATMENT', 'treatment', treatmentId, {
    patient_id,
    procedure_name,
  })

  return jsonResponse({ message: 'Treatment planned successfully', treatmentId }, 201)
}

export async function handleUpdateTreatment(
  request: Request,
  env: Env,
  user: User,
  treatmentId: string
): Promise<Response> {
  let body: Partial<Treatment>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const existing = await env.DB.prepare('SELECT * FROM treatments WHERE id = ?')
    .bind(treatmentId)
    .first<Treatment>()

  if (!existing) {
    return errorResponse('Treatment record not found', 404)
  }

  let completionDate = body.completion_date !== undefined ? body.completion_date : existing.completion_date
  if (body.status === 'Completed' && !completionDate) {
    completionDate = new Date().toISOString().split('T')[0]
  }

  await env.DB.prepare(
    `UPDATE treatments SET
      procedure_name = COALESCE(?, procedure_name),
      tooth_number = COALESCE(?, tooth_number),
      description = COALESCE(?, description),
      estimated_cost_paise = COALESCE(?, estimated_cost_paise),
      actual_cost_paise = COALESCE(?, actual_cost_paise),
      status = COALESCE(?, status),
      start_date = COALESCE(?, start_date),
      completion_date = ?,
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(
      body.procedure_name || null,
      body.tooth_number || null,
      body.description || null,
      body.estimated_cost_paise !== undefined ? body.estimated_cost_paise : null,
      body.actual_cost_paise !== undefined ? body.actual_cost_paise : null,
      body.status || null,
      body.start_date || null,
      completionDate,
      body.notes || null,
      treatmentId
    )
    .run()

  await logAudit(env.DB, user.id, 'UPDATE_TREATMENT', 'treatment', treatmentId, body)

  return jsonResponse({ message: 'Treatment updated successfully' })
}
