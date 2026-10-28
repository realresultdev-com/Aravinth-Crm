export type UserRole = 'admin' | 'dentist' | 'receptionist'

export interface User {
  id: string
  username: string
  full_name: string
  role: UserRole
  phone?: string | null
  email?: string | null
  is_active: number
  created_at: string
}

export interface Patient {
  id: string
  full_name: string
  phone: string
  email?: string | null
  dob?: string | null
  age?: number | null
  gender?: 'Male' | 'Female' | 'Other' | null
  address?: string | null
  emergency_name?: string | null
  emergency_phone?: string | null
  registration_date: string
  chief_complaint?: string | null
  medical_history?: string | null
  allergies?: string | null
  medications?: string | null
  dental_history?: string | null
  previous_treatments?: string | null
  dentist_notes?: string | null
  created_at: string
  updated_at: string
  last_visit?: string | null
  next_appointment?: string | null
}

export interface Appointment {
  id: string
  patient_id: string
  dentist_id?: string | null
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  reason: string
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-show'
  notes?: string | null
  created_at: string
  updated_at: string
  patient_name?: string
  patient_phone?: string
  dentist_name?: string
}

export interface Consultation {
  id: string
  patient_id: string
  dentist_id: string
  consultation_date: string
  chief_complaint?: string | null
  clinical_observations?: string | null
  examination_notes?: string | null
  diagnosis: string
  treatment_recommendation?: string | null
  prescription_notes?: string | null
  follow_up_recommendation?: string | null
  next_review_date?: string | null
  created_at: string
  dentist_name?: string
  patient_name?: string
  patient_phone?: string
}

export interface Treatment {
  id: string
  patient_id: string
  consultation_id?: string | null
  procedure_name: string
  tooth_number?: string | null
  description?: string | null
  estimated_cost_paise: number
  actual_cost_paise: number
  status: 'Planned' | 'In progress' | 'Completed' | 'Cancelled'
  start_date?: string | null
  completion_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  patient_name?: string
}

export interface Payment {
  id: string
  patient_id: string
  treatment_id?: string | null
  appointment_id?: string | null
  receipt_number: string
  total_amount_paise: number
  amount_paid_paise: number
  outstanding_balance_paise: number
  payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'
  payment_date: string
  transaction_reference?: string | null
  notes?: string | null
  created_by: string
  created_at: string
  patient_name?: string
  created_by_name?: string
  procedure_name?: string
}

export interface FollowUp {
  id: string
  patient_id: string
  consultation_id?: string | null
  treatment_id?: string | null
  follow_up_date: string
  reason: string
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled'
  notes?: string | null
  created_at: string
  updated_at: string
  patient_name?: string
  patient_phone?: string
}

export interface ClinicSettings {
  id: string
  clinic_name: string
  phone: string
  email: string
  address: string
  default_appointment_duration: number
  treatment_options: string
  treatmentOptions?: Array<{
    id: string
    name: string
    category: string
    default_cost_paise: number
  }>
  created_at: string
  updated_at: string
}
