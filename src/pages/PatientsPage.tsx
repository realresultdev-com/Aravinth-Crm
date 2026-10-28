import React, { useEffect, useState } from 'react'
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react'
import { api } from '../api/client'
import { Patient } from '../types'
import { NavTab } from '../components/Layout'

interface PatientsPageProps {
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function PatientsPage({ onNavigate }: PatientsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Query state
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortBy, setSortBy] = useState('registration_date')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const fetchPatients = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.patients.list({
        search: search.trim() || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      })
      setPatients(res.patients)
      setPagination({
        total: res.pagination.total,
        totalPages: res.pagination.totalPages || 1,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch patients from D1')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [page, sortBy, sortOrder])

  // Debounced or enter search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPatients()
  }

  return (
    <div className="space-y-6">
      {/* Page Heading & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202421]">Patient Directory</h1>
          <p className="text-xs text-[#6B716D] mt-0.5">
            Search, manage, and view dental clinical records across {pagination.total} registered patients
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('patient-register')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E2E5E0] p-3 rounded flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#6B716D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAF7] border border-[#E2E5E0] rounded pl-8 pr-3 py-1.5 text-xs text-[#202421] placeholder-[#6B716D]/70 focus:outline-none focus:border-[#276B65] focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#F2F3F0] hover:bg-[#E2E5E0] text-[#202421] text-xs font-semibold rounded cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end text-xs">
          <div className="flex items-center gap-1.5 text-[#6B716D]">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAFAF7] border border-[#E2E5E0] rounded px-2 py-1 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
            >
              <option value="registration_date">Registration Date</option>
              <option value="full_name">Patient Name</option>
              <option value="id">Patient ID</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#FAFAF7] border border-[#E2E5E0] rounded px-2 py-1 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest / A-Z</option>
            </select>
          </div>

          <button
            onClick={fetchPatients}
            disabled={loading}
            className="p-1.5 border border-[#E2E5E0] rounded hover:bg-[#FAFAF7] text-[#6B716D] hover:text-[#202421] cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030]">
          {error}
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white border border-[#E2E5E0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2F3F0] text-[#6B716D] font-semibold border-b border-[#E2E5E0]">
                <th className="py-2.5 px-4">Patient ID</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Phone Number</th>
                <th className="py-2.5 px-4">Registered</th>
                <th className="py-2.5 px-4">Last Visit</th>
                <th className="py-2.5 px-4">Next Appointment</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B716D]">
                    Loading patient records from Cloudflare D1...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B716D]">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-[#6B716D]/50" />
                    <p className="font-medium text-sm text-[#202421]">No patients found</p>
                    <p className="text-xs text-[#6B716D] mt-0.5">
                      {search ? 'Try clearing your search query.' : 'Register your first clinic patient.'}
                    </p>
                    {search && (
                      <button
                        onClick={() => {
                          setSearch('')
                          setPage(1)
                          fetchPatients()
                        }}
                        className="mt-2 text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
                      >
                        Clear search filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAF7] transition-colors">
                    {/* Patient ID */}
                    <td className="py-3 px-4 font-bold text-[#276B65] text-sm">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: p.id })}
                        className="hover:underline cursor-pointer text-left"
                      >
                        {p.id}
                      </button>
                    </td>

                    {/* Patient Name & Demographics */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: p.id })}
                        className="font-semibold text-[#202421] hover:text-[#276B65] hover:underline cursor-pointer text-left block text-sm"
                      >
                        {p.full_name}
                      </button>
                      <span className="text-xs text-[#6B716D]">
                        {p.gender || '—'}, {p.age ? `${p.age} yrs` : 'Age N/A'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 text-[#202421] text-sm">{p.phone}</td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 text-[#6B716D]">{p.registration_date}</td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 text-[#6B716D]">
                      {p.last_visit || <span className="text-[#6B716D]/60">None recorded</span>}
                    </td>

                    {/* Next Appointment */}
                    <td className="py-3 px-4">
                      {p.next_appointment ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#276B65] bg-[#EEF5F4] px-2 py-0.5 rounded border border-[#276B65]/20">
                          <Calendar className="w-3 h-3" />
                          {p.next_appointment}
                        </span>
                      ) : (
                        <span className="text-[#6B716D]/60">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('patient-profile', { patientId: p.id })}
                          className="px-2 py-1 rounded border border-[#E2E5E0] hover:border-[#276B65] hover:bg-[#EEF5F4] text-[#276B65] text-[11px] font-semibold transition-colors cursor-pointer"
                          title="View complete clinical profile"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onNavigate('appointments', { patientId: p.id })}
                          className="p-1 text-[#6B716D] hover:text-[#202421] rounded hover:bg-[#F2F3F0] cursor-pointer"
                          title="Schedule appointment"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigate('consultations', { patientId: p.id })}
                          className="p-1 text-[#6B716D] hover:text-[#202421] rounded hover:bg-[#F2F3F0] cursor-pointer"
                          title="Record clinical consultation"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-3 border-t border-[#E2E5E0] bg-[#FAFAF7] flex items-center justify-between text-xs text-[#6B716D]">
          <span>
            Showing {patients.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, pagination.total)} of {pagination.total} patients
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded border border-[#E2E5E0] bg-white text-[#202421] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-[#202421]">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="p-1.5 rounded border border-[#E2E5E0] bg-white text-[#202421] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
