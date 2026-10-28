import { jsonResponse } from '../db'
import { Env, User } from '../types'

export async function handleGetDashboardSummary(request: Request, env: Env, user: User): Promise<Response> {
  const today = new Date().toISOString().split('T')[0]

  // Query real operational metrics from D1 in parallel
  const [
    totalPatientsRow,
    todayAppointmentsRow,
    todayConsultationsRow,
    pendingPaymentsRow,
    upcomingFollowUpsRow,
    todayAppointmentsList,
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM patients').first<{ count: number }>(),

    env.DB.prepare(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?'
    ).bind(today).first<{ count: number }>(),

    env.DB.prepare(
      'SELECT COUNT(*) as count FROM consultations WHERE consultation_date = ?'
    ).bind(today).first<{ count: number }>(),

    env.DB.prepare(
      'SELECT COALESCE(SUM(outstanding_balance_paise), 0) as total_outstanding_paise FROM payments'
    ).first<{ total_outstanding_paise: number }>(),

    env.DB.prepare(
      "SELECT COUNT(*) as count FROM follow_ups WHERE follow_up_date >= ? AND status = 'Pending'"
    ).bind(today).first<{ count: number }>(),

    env.DB.prepare(
      `SELECT 
        a.id, a.patient_id, a.appointment_date, a.start_time, a.end_time,
        a.reason, a.status, a.notes,
        p.full_name as patient_name,
        p.phone as patient_phone,
        u.full_name as dentist_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.dentist_id = u.id
       WHERE a.appointment_date = ?
       ORDER BY a.start_time ASC`
    ).bind(today).all(),
  ])

  return jsonResponse({
    metrics: {
      totalPatients: totalPatientsRow?.count || 0,
      todayAppointments: todayAppointmentsRow?.count || 0,
      todayConsultations: todayConsultationsRow?.count || 0,
      pendingPaymentsPaise: pendingPaymentsRow?.total_outstanding_paise || 0,
      upcomingFollowUps: upcomingFollowUpsRow?.count || 0,
    },
    todayAppointments: todayAppointmentsList.results,
    todayDate: today,
  })
}
