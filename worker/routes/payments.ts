import { generateRandomHex } from '../auth'
import { jsonResponse, errorResponse, logAudit } from '../db'
import { Env, Payment, User } from '../types'

export async function handleGetPayments(request: Request, env: Env, user: User): Promise<Response> {
  const url = new URL(request.url)
  const patientId = url.searchParams.get('patientId')
  const date = url.searchParams.get('date')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let whereClause = '1=1'
  const bindings: string[] = []

  if (patientId) {
    whereClause += ' AND p.patient_id = ?'
    bindings.push(patientId)
  }
  if (date) {
    whereClause += ' AND p.payment_date = ?'
    bindings.push(date)
  } else if (startDate && endDate) {
    whereClause += ' AND p.payment_date BETWEEN ? AND ?'
    bindings.push(startDate, endDate)
  }

  const query = `
    SELECT 
      p.*,
      pt.full_name as patient_name,
      pt.phone as patient_phone,
      u.full_name as created_by_name,
      t.procedure_name
    FROM payments p
    JOIN patients pt ON p.patient_id = pt.id
    JOIN users u ON p.created_by = u.id
    LEFT JOIN treatments t ON p.treatment_id = t.id
    WHERE ${whereClause}
    ORDER BY p.payment_date DESC, p.created_at DESC
  `

  const { results } = await env.DB.prepare(query).bind(...bindings).all()
  return jsonResponse({ payments: results })
}

export async function handleCreatePayment(request: Request, env: Env, user: User): Promise<Response> {
  let body: {
    patient_id: string
    treatment_id?: string
    appointment_id?: string
    total_amount_paise: number
    amount_paid_paise: number
    payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'
    payment_date?: string
    transaction_reference?: string
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON format', 400)
  }

  const { patient_id, total_amount_paise, amount_paid_paise, payment_method } = body
  if (!patient_id) {
    return errorResponse('Patient ID is required', 400)
  }
  if (!payment_method) {
    return errorResponse('Payment method is required', 400)
  }

  const totalPaise = Math.max(0, Math.round(Number(total_amount_paise) || 0))
  const paidPaise = Math.max(0, Math.round(Number(amount_paid_paise) || 0))
  const outstandingPaise = Math.max(0, totalPaise - paidPaise)

  // Generate unique human-readable Receipt number: RCP-YYYY-XXXX
  const currentYear = new Date().getFullYear()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
  const receiptNumber = `RCP-${currentYear}-${randomSuffix}`
  const paymentId = 'pay-' + generateRandomHex(8)
  const paymentDate = body.payment_date || new Date().toISOString().split('T')[0]

  await env.DB.prepare(
    `INSERT INTO payments (
      id, patient_id, treatment_id, appointment_id, receipt_number,
      total_amount_paise, amount_paid_paise, outstanding_balance_paise,
      payment_method, payment_date, transaction_reference, notes, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      paymentId,
      patient_id,
      body.treatment_id || null,
      body.appointment_id || null,
      receiptNumber,
      totalPaise,
      paidPaise,
      outstandingPaise,
      payment_method,
      paymentDate,
      body.transaction_reference?.trim() || null,
      body.notes?.trim() || null,
      user.id
    )
    .run()

  await logAudit(env.DB, user.id, 'RECORD_PAYMENT', 'payment', paymentId, {
    patient_id,
    receiptNumber,
    paidPaise,
    totalPaise,
    outstandingPaise,
  })

  return jsonResponse(
    {
      message: 'Payment recorded successfully',
      paymentId,
      receiptNumber,
      amountPaidPaise: paidPaise,
      outstandingBalancePaise: outstandingPaise,
    },
    201
  )
}

export async function handleGetCollectionsSummary(request: Request, env: Env, user: User): Promise<Response> {
  // Calculate today and month totals from D1 directly
  const today = new Date().toISOString().split('T')[0]
  const currentMonthPrefix = today.substring(0, 7) // YYYY-MM

  const [todayStats, monthStats, methodBreakdown] = await Promise.all([
    env.DB.prepare(
      `SELECT 
        COALESCE(SUM(amount_paid_paise), 0) as total_collected_paise,
        COUNT(*) as transaction_count
       FROM payments 
       WHERE payment_date = ?`
    ).bind(today).first<{ total_collected_paise: number; transaction_count: number }>(),

    env.DB.prepare(
      `SELECT 
        COALESCE(SUM(amount_paid_paise), 0) as total_collected_paise,
        COALESCE(SUM(outstanding_balance_paise), 0) as total_outstanding_paise,
        COUNT(*) as transaction_count
       FROM payments 
       WHERE payment_date LIKE ?`
    ).bind(`${currentMonthPrefix}%`).first<{
      total_collected_paise: number
      total_outstanding_paise: number
      transaction_count: number
    }>(),

    env.DB.prepare(
      `SELECT payment_method, COALESCE(SUM(amount_paid_paise), 0) as total_paise, COUNT(*) as count
       FROM payments
       WHERE payment_date LIKE ?
       GROUP BY payment_method`
    ).bind(`${currentMonthPrefix}%`).all(),
  ])

  return jsonResponse({
    today: todayStats,
    month: monthStats,
    methodBreakdown: methodBreakdown.results,
  })
}
