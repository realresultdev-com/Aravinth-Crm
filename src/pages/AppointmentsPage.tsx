import React, { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Filter,
} from 'lucide-react'
import { api } from '../api/client'
import { Appointment, Patient } from '../types'
import { NavTab } from '../components/Layout'

interface AppointmentsPageProps {
  initialPatientId?: string
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function AppointmentsPage({ initialPatientId, onNavigate }: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Modal Form State
  const [patientSearch, setPatientSearch] = useState('')
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newStartTime, setNewStartTime] = useState('10:00')
  const [newDuration, setNewDuration] = useState(30)
  const [newReason, setNewReason] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const fetchAppointments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.appointments.list({
        date: dateFilter || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      })
      setAppointments(res.appointments)
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [dateFilter, statusFilter])

  // Search patients when booking modal opens or user types
  useEffect(() => {
    if (isModalOpen) {
      api.patients.list({ search: patientSearch, limit: 10 }).then((res) => {
        setPatientList(res.patients)
        if (!selectedPatientId && res.patients.length > 0 && !initialPatientId) {
          setSelectedPatientId(res.patients[0].id)
        }
      })
    }
  }, [isModalOpen, patientSearch])

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedPatientId) {
      setModalError('Please select a patient.')
      return
    }
    if (!newReason.trim()) {
      setModalError('Please enter an appointment reason.')
      return
    }

    setModalLoading(true)
    try {
      await api.appointments.create({
        patient_id: selectedPatientId,
        appointment_date: newDate,
        start_time: newStartTime,
        duration_minutes: Number(newDuration),
        reason: newReason.trim(),
        notes: newNotes.trim() || undefined,
      })
      setIsModalOpen(false)
      setNewReason('')
      setNewNotes('')
      fetchAppointments()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to schedule appointment')
    } finally {
      setModalLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await api.appointments.update(appointmentId, { status })
      fetchAppointments()
    } catch (err: any) {
      alert(err?.message || 'Failed to update appointment status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointment Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily appointments and prevent conflicting bookings (Asia/Kolkata timezone)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#276B65] hover:bg-[#1e5550] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#276B65]/20 focus:border-[#276B65]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#276B65]/20 focus:border-[#276B65]"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
          </div>

          <button
            onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#EEF5F4] text-[#276B65] font-semibold text-xs transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Appointments List / Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Reason / Purpose</th>
                <th className="py-3 px-4">Dentist</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading appointments from D1...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold text-base text-slate-900">No appointments found for this date</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-sm text-[#276B65] font-semibold hover:underline cursor-pointer"
                    >
                      + Schedule an appointment
                    </button>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-sm">
                        {apt.start_time} - {apt.end_time}
                      </div>
                      <span className="block text-xs text-slate-500 mt-0.5 font-normal">
                        {apt.duration_minutes} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: apt.patient_id })}
                        className="font-semibold text-slate-900 hover:text-[#276B65] hover:underline cursor-pointer text-left text-sm"
                      >
                        {apt.patient_name}
                      </button>
                      <span className="block text-xs text-slate-500 mt-0.5 font-normal">{apt.patient_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-sm font-medium">{apt.patient_phone}</td>
                    <td className="py-3.5 px-4 text-slate-700 text-sm">{apt.reason}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-sm">{apt.dentist_name || 'Dr. Aravinth BDS, MDS'}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={apt.status}
                        onChange={(e) =>
                          handleStatusChange(apt.id, e.target.value as Appointment['status'])
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('consultations', { patientId: apt.patient_id })}
                        className="text-xs font-semibold text-[#276B65] hover:text-[#1e5550] hover:underline cursor-pointer mr-3"
                      >
                        Consult
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'Cancelled')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-lg p-6 shadow-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421] rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#202421] mb-1">Schedule Appointment</h3>
            <p className="text-xs text-[#6B716D] mb-4">
              Enforces dentist calendar conflict detection in the data layer.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#C53030]/30 rounded text-xs text-[#C53030]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202421] mb-1">Select Patient *</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full bg-[#FAFAF7] border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-2 text-xs text-[#202421]"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patientList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.id}) • {p.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-[#202421] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-2.5 py-1.5 text-xs text-[#202421]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-2.5 py-1.5 text-xs text-[#202421]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-2.5 py-1.5 text-xs text-[#202421]"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Appointment Purpose / Reason *</label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Staff Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E5E0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#E2E5E0] bg-white text-xs text-[#6B716D] hover:text-[#202421]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {modalLoading ? 'Validating Conflicts...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
