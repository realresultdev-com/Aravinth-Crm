import { getSessionUser, validateCsrf } from './auth'
import { errorResponse, jsonResponse } from './db'
import { handleLogin, handleLogout, handleGetMe, handleChangePassword } from './routes/auth'
import { handleGetPatients, handleCreatePatient, handleGetPatient, handleUpdatePatient } from './routes/patients'
import { handleGetAppointments, handleCreateAppointment, handleUpdateAppointment } from './routes/appointments'
import { handleGetConsultations, handleCreateConsultation } from './routes/consultations'
import { handleGetTreatments, handleCreateTreatment, handleUpdateTreatment } from './routes/treatments'
import { handleGetPayments, handleCreatePayment, handleGetCollectionsSummary } from './routes/payments'
import { handleGetDashboardSummary } from './routes/dashboard'
import { handleGetSettings, handleUpdateSettings, handleGetUsers, handleCreateUser } from './routes/settings'
import { Env } from './types'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    // 1. Handle CORS Preflight if any
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': url.origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Protection',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // 2. Route API Requests
    if (pathname.startsWith('/api')) {
      try {
        // Public API routes (no session needed)
        if (pathname === '/api/auth/login') {
          return await handleLogin(request, env)
        }

        // Authenticate Session for all other /api endpoints
        const user = await getSessionUser(env.DB, request)

        // Logout can be invoked even with expired/invalid session to clear cookie
        if (pathname === '/api/auth/logout') {
          return await handleLogout(request, env, user)
        }

        // Require authentication for all protected endpoints
        if (!user) {
          return errorResponse('Authentication required. Please sign in.', 401)
        }

        // CSRF verification for state-changing requests
        if (!validateCsrf(request)) {
          return errorResponse('CSRF protection check failed', 403)
        }

        // Auth Endpoints
        if (pathname === '/api/auth/me') {
          return await handleGetMe(request, env, user)
        }
        if (pathname === '/api/auth/change-password') {
          return await handleChangePassword(request, env, user)
        }

        // Dashboard Endpoint
        if (pathname === '/api/dashboard/summary' && request.method === 'GET') {
          return await handleGetDashboardSummary(request, env, user)
        }

        // Patients Endpoints
        if (pathname === '/api/patients') {
          if (request.method === 'GET') return await handleGetPatients(request, env, user)
          if (request.method === 'POST') return await handleCreatePatient(request, env, user)
        }

        const patientMatch = pathname.match(/^\/api\/patients\/([^/]+)$/)
        if (patientMatch) {
          const patientId = decodeURIComponent(patientMatch[1])
          if (request.method === 'GET') return await handleGetPatient(request, env, user, patientId)
          if (request.method === 'PATCH' || request.method === 'PUT') {
            return await handleUpdatePatient(request, env, user, patientId)
          }
        }

        // Appointments Endpoints
        if (pathname === '/api/appointments') {
          if (request.method === 'GET') return await handleGetAppointments(request, env, user)
          if (request.method === 'POST') return await handleCreateAppointment(request, env, user)
        }

        const appointmentMatch = pathname.match(/^\/api\/appointments\/([^/]+)$/)
        if (appointmentMatch) {
          const appointmentId = decodeURIComponent(appointmentMatch[1])
          if (request.method === 'PATCH' || request.method === 'PUT') {
            return await handleUpdateAppointment(request, env, user, appointmentId)
          }
        }

        // Consultations Endpoints
        if (pathname === '/api/consultations') {
          if (request.method === 'GET') return await handleGetConsultations(request, env, user)
          if (request.method === 'POST') return await handleCreateConsultation(request, env, user)
        }

        // Treatments Endpoints
        if (pathname === '/api/treatments') {
          if (request.method === 'GET') return await handleGetTreatments(request, env, user)
          if (request.method === 'POST') return await handleCreateTreatment(request, env, user)
        }

        const treatmentMatch = pathname.match(/^\/api\/treatments\/([^/]+)$/)
        if (treatmentMatch) {
          const treatmentId = decodeURIComponent(treatmentMatch[1])
          if (request.method === 'PATCH' || request.method === 'PUT') {
            return await handleUpdateTreatment(request, env, user, treatmentId)
          }
        }

        // Payments Endpoints
        if (pathname === '/api/payments') {
          if (request.method === 'GET') return await handleGetPayments(request, env, user)
          if (request.method === 'POST') return await handleCreatePayment(request, env, user)
        }
        if (pathname === '/api/reports/collections' && request.method === 'GET') {
          return await handleGetCollectionsSummary(request, env, user)
        }



        // Settings & Staff Endpoints
        if (pathname === '/api/settings') {
          if (request.method === 'GET') return await handleGetSettings(request, env, user)
          if (request.method === 'PATCH' || request.method === 'PUT') {
            return await handleUpdateSettings(request, env, user)
          }
        }
        if (pathname === '/api/users') {
          if (request.method === 'GET') return await handleGetUsers(request, env, user)
          if (request.method === 'POST') return await handleCreateUser(request, env, user)
        }

        return errorResponse(`API endpoint not found: ${pathname}`, 404)
      } catch (err: any) {
        console.error('API Error:', err)
        return errorResponse('Internal server error', 500, err?.message || 'Unexpected failure')
      }
    }

    // 3. Fallback to Static Asset Fetcher (SPA)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not Found', { status: 404 })
  },
}
