import React, { useEffect, useState } from 'react'
import {
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  UserPlus,
  Receipt,
  FileText,
} from 'lucide-react'
import { api } from '../api/client'
import { Appointment } from '../types'
import { NavTab } from '../components/Layout'

interface DashboardPageProps {
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    metrics: {
      totalPatients: number
      todayAppointments: number
      todayConsultations: number
      pendingPaymentsPaise: number
      upcomingFollowUps: number
    }
    todayAppointments: Appointment[]
    todayDate: string
  } | null>(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.dashboard.getSummary()
      setData(res)
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics from Cloudflare D1')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await api.appointments.update(appointmentId, { status })
      fetchSummary()
    } catch (err: any) {
      alert(err?.message || 'Failed to update status')
    }
  }

  const formatCurrency = (paise: number) => {
    const inr = paise / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(inr)
  }

  return (
    <div className="space-y-6">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202421]">Clinic Operations Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="p-2 border border-[#E2E5E0] bg-white text-[#6B716D] hover:text-[#202421] rounded text-xs transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('patient-register')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Patient</span>
          </button>
          <button
            onClick={() => onNavigate('appointments')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#E2E5E0] hover:border-[#276B65] text-[#202421] text-xs font-medium transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#276B65]" />
            <span>Schedule Appointment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSummary} className="underline font-semibold ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Real Operational Metrics Summary Grid with iOS Glassmorphism */}
      <div className="relative">
        {/* Ambient frosted glass refraction glow */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-100/40 via-[#276B65]/10 to-teal-100/30 rounded-3xl blur-xl opacity-70 -z-10 pointer-events-none" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Patients */}
          <div
            onClick={() => onNavigate('patients')}
            className="ios-glass-card p-5 group cursor-pointer"
          >
            {/* Top glass glare highlight */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-xs pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            
            <div className="mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B716D]">
                Patients
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#202421]">
              {loading ? '—' : data?.metrics.totalPatients ?? 0}
            </div>
            <span className="text-xs text-[#6B716D] font-medium mt-1 block">
              Total Registered
            </span>
          </div>

          {/* Today's Appointments */}
          <div
            onClick={() => onNavigate('appointments')}
            className="ios-glass-card p-5 group cursor-pointer"
          >
            {/* Top glass glare highlight */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-xs pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B716D]">
                Appointments
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#202421]">
              {loading ? '—' : data?.metrics.todayAppointments ?? 0}
            </div>
            <span className="text-xs text-[#6B716D] font-medium mt-1 block">
              Scheduled Today
            </span>
          </div>

          {/* Completed Consultations Today */}
          <div
            onClick={() => onNavigate('consultations')}
            className="ios-glass-card p-5 group cursor-pointer"
          >
            {/* Top glass glare highlight */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-xs pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B716D]">
                Consultations
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#202421]">
              {loading ? '—' : data?.metrics.todayConsultations ?? 0}
            </div>
            <span className="text-xs text-[#6B716D] font-medium mt-1 block">
              Completed Today
            </span>
          </div>

          {/* Pending Payments */}
          <div
            onClick={() => onNavigate('payments')}
            className="ios-glass-card p-5 group cursor-pointer"
          >
            {/* Top glass glare highlight */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-xs pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B716D]">
                Outstanding
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#202421] truncate">
              {loading ? '—' : formatCurrency(data?.metrics.pendingPaymentsPaise ?? 0)}
            </div>
            <span className="text-xs text-[#6B716D] font-medium mt-1 block">
              Pending Balances
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Quick Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E5E0] rounded">
          <div className="p-4 border-b border-[#E2E5E0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#202421]">Today's Appointment Schedule</h2>
              <p className="text-[11px] text-[#6B716D]">
                Date: {data?.todayDate || new Date().toISOString().split('T')[0]} (Asia/Kolkata)
              </p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-[#276B65] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2F3F0] text-[#6B716D] font-semibold border-b border-[#E2E5E0]">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Patient Name</th>
                  <th className="py-2.5 px-4">Purpose / Reason</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B716D]">
                      Loading today's schedule from D1...
                    </td>
                  </tr>
                ) : !data?.todayAppointments || data.todayAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B716D]">
                      <Calendar className="w-6 h-6 mx-auto mb-1 text-[#6B716D]/40" />
                      <p>No appointments scheduled for today.</p>
                      <button
                        onClick={() => onNavigate('appointments')}
                        className="mt-2 text-[#276B65] hover:underline font-semibold cursor-pointer"
                      >
                        + Schedule an appointment
                      </button>
                    </td>
                  </tr>
                ) : (
                  data.todayAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-[#FAFAF7] transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap text-sm">
                        {apt.start_time} - {apt.end_time}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigate('patient-profile', { patientId: apt.patient_id })}
                          className="font-semibold text-slate-900 hover:text-[#276B65] text-left hover:underline cursor-pointer text-sm"
                        >
                          {apt.patient_name}
                        </button>
                        <span className="block text-xs text-slate-500 mt-0.5">{apt.patient_phone}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-sm">{apt.reason}</td>
                      <td className="py-3 px-4">
                        <select
                          value={apt.status}
                          onChange={(e) =>
                            handleUpdateStatus(apt.id, e.target.value as Appointment['status'])
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all ${
                            apt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : apt.status === 'Confirmed'
                              ? 'bg-teal-50 text-[#276B65] border-[#276B65]/30'
                              : apt.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-slate-50 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No-show">No-show</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('consultations', { patientId: apt.patient_id })}
                          className="text-xs font-semibold text-[#276B65] hover:text-[#1e5550] hover:underline cursor-pointer"
                        >
                          Consult
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Action & Operations Panel (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E5E0] p-4 rounded">
            <h2 className="text-sm font-bold text-[#202421] mb-1">Quick Clinical Actions</h2>
            <p className="text-[11px] text-[#6B716D] mb-4">
              Common tasks for staff and dentist workflows
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('patient-register')}
                className="w-full flex items-center justify-between p-2.5 rounded border border-[#E2E5E0] hover:border-[#276B65] hover:bg-[#EEF5F4] text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-[#276B65]" />
                  <div>
                    <span className="font-semibold text-[#202421] block">Register New Patient</span>
                    <span className="text-[10px] text-[#6B716D]">Create DAC-XXXXXX profile</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B716D]" />
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className="w-full flex items-center justify-between p-2.5 rounded border border-[#E2E5E0] hover:border-[#276B65] hover:bg-[#EEF5F4] text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#276B65]" />
                  <div>
                    <span className="font-semibold text-[#202421] block">Book Appointment</span>
                    <span className="text-[10px] text-[#6B716D]">With conflict validation</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B716D]" />
              </button>

              <button
                onClick={() => onNavigate('consultations')}
                className="w-full flex items-center justify-between p-2.5 rounded border border-[#E2E5E0] hover:border-[#276B65] hover:bg-[#EEF5F4] text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#276B65]" />
                  <div>
                    <span className="font-semibold text-[#202421] block">Record Consultation</span>
                    <span className="text-[10px] text-[#6B716D]">Enter diagnosis & prescription</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B716D]" />
              </button>

              <button
                onClick={() => onNavigate('payments')}
                className="w-full flex items-center justify-between p-2.5 rounded border border-[#E2E5E0] hover:border-[#276B65] hover:bg-[#EEF5F4] text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#276B65]" />
                  <div>
                    <span className="font-semibold text-[#202421] block">Add Payment</span>
                    <span className="text-[10px] text-[#6B716D]">Cash, UPI, Card receipts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B716D]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
