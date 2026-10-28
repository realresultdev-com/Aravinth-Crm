import {
  Appointment,
  ClinicSettings,
  Consultation,
  FollowUp,
  Patient,
  Payment,
  Treatment,
  User,
} from '../types'

class ApiError extends Error {
  status: number
  details?: unknown
  warning?: string
  existingPatient?: unknown

  constructor(message: string, status: number, details?: unknown, warning?: string, existingPatient?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.warning = warning
    this.existingPatient = existingPatient
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('X-Requested-With', 'XMLHttpRequest')

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Handle 401 unauthenticated
  if (res.status === 401 && !path.includes('/api/auth/login')) {
    // If not on login page, fire custom event or return error
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  // Handle CSV or file downloads
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('text/csv')) {
    const text = await res.text()
    return text as unknown as T
  }

  let data: any = null
  try {
    data = await res.json()
  } catch {
    // No json body
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${res.status} error`
    throw new ApiError(message, res.status, data?.error?.details, data?.warning, data?.existingPatient)
  }

  return data as T
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),
    me: () => request<{ user: User }>('/api/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  dashboard: {
    getSummary: () =>
      request<{
        metrics: {
          totalPatients: number
          todayAppointments: number
          todayConsultations: number
          pendingPaymentsPaise: number
          upcomingFollowUps: number
        }
        todayAppointments: Appointment[]
        todayDate: string
      }>('/api/dashboard/summary'),
  },

  patients: {
    list: (params: {
      search?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'ASC' | 'DESC'
    } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.page) q.set('page', params.page.toString())
      if (params.limit) q.set('limit', params.limit.toString())
      if (params.sortBy) q.set('sortBy', params.sortBy)
      if (params.sortOrder) q.set('sortOrder', params.sortOrder)
      return request<{
        patients: Patient[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>(`/api/patients?${q.toString()}`)
    },

    get: (id: string) =>
      request<{
        patient: Patient
        appointments: Appointment[]
        consultations: Consultation[]
        treatments: Treatment[]
        payments: Payment[]
        followUps: FollowUp[]
      }>(`/api/patients/${encodeURIComponent(id)}`),

    create: (data: Partial<Patient>, forceDuplicate = false) =>
      request<{ message: string; patientId: string }>('/api/patients', {
        method: 'POST',
        body: JSON.stringify({ ...data, forceDuplicate }),
      }),

    update: (id: string, data: Partial<Patient>) =>
      request<{ message: string }>(`/api/patients/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  appointments: {
    list: (params: {
      date?: string
      startDate?: string
      endDate?: string
      status?: string
      dentistId?: string
      patientId?: string
    } = {}) => {
      const q = new URLSearchParams()
      if (params.date) q.set('date', params.date)
      if (params.startDate) q.set('startDate', params.startDate)
      if (params.endDate) q.set('endDate', params.endDate)
      if (params.status) q.set('status', params.status)
      if (params.dentistId) q.set('dentistId', params.dentistId)
      if (params.patientId) q.set('patientId', params.patientId)
      return request<{ appointments: Appointment[] }>(`/api/appointments?${q.toString()}`)
    },

    create: (data: Partial<Appointment>) =>
      request<{ message: string; appointmentId: string }>('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Appointment>) =>
      request<{ message: string }>(`/api/appointments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  consultations: {
    list: (params: { patientId?: string; dentistId?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.patientId) q.set('patientId', params.patientId)
      if (params.dentistId) q.set('dentistId', params.dentistId)
      return request<{ consultations: Consultation[] }>(`/api/consultations?${q.toString()}`)
    },

    create: (data: Partial<Consultation>) =>
      request<{ message: string; consultationId: string }>('/api/consultations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  treatments: {
    list: (params: { patientId?: string; status?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.patientId) q.set('patientId', params.patientId)
      if (params.status) q.set('status', params.status)
      return request<{ treatments: Treatment[] }>(`/api/treatments?${q.toString()}`)
    },

    create: (data: Partial<Treatment>) =>
      request<{ message: string; treatmentId: string }>('/api/treatments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Treatment>) =>
      request<{ message: string }>(`/api/treatments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  payments: {
    list: (params: { patientId?: string; date?: string; startDate?: string; endDate?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.patientId) q.set('patientId', params.patientId)
      if (params.date) q.set('date', params.date)
      if (params.startDate) q.set('startDate', params.startDate)
      if (params.endDate) q.set('endDate', params.endDate)
      return request<{ payments: Payment[] }>(`/api/payments?${q.toString()}`)
    },

    create: (data: {
      patient_id: string
      treatment_id?: string
      appointment_id?: string
      total_amount_paise: number
      amount_paid_paise: number
      payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'
      payment_date?: string
      transaction_reference?: string
      notes?: string
    }) =>
      request<{
        message: string
        paymentId: string
        receiptNumber: string
        amountPaidPaise: number
        outstandingBalancePaise: number
      }>('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getCollections: () =>
      request<{
        today: { total_collected_paise: number; transaction_count: number }
        month: {
          total_collected_paise: number
          total_outstanding_paise: number
          transaction_count: number
        }
        methodBreakdown: Array<{ payment_method: string; total_paise: number; count: number }>
      }>('/api/reports/collections'),
  },

  settings: {
    get: () => request<{ settings: ClinicSettings }>('/api/settings'),
    update: (data: Partial<ClinicSettings>) =>
      request<{ message: string }>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getUsers: () => request<{ users: User[] }>('/api/users'),
    createUser: (data: {
      username: string
      password: string
      full_name: string
      role: 'admin' | 'dentist' | 'receptionist'
      phone?: string
      email?: string
    }) =>
      request<{ message: string; userId: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
