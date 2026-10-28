import React, { useEffect, useState } from 'react'
import {
  Activity,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react'
import { api } from '../api/client'
import { Patient, Treatment } from '../types'
import { NavTab } from '../components/Layout'

interface TreatmentsPageProps {
  initialPatientId?: string
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function TreatmentsPage({ initialPatientId, onNavigate }: TreatmentsPageProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('All')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Form
  const [patientSearch, setPatientSearch] = useState('')
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '')
  const [procedureName, setProcedureName] = useState('')
  const [toothNumber, setToothNumber] = useState('')
  const [estimatedCostInr, setEstimatedCostInr] = useState('1500')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Treatment['status']>('Planned')

  const fetchTreatments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.treatments.list({
        status: statusFilter !== 'All' ? statusFilter : undefined,
      })
      setTreatments(res.treatments)
    } catch (err: any) {
      setError(err?.message || 'Failed to load treatments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTreatments()
  }, [statusFilter])

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

  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedPatientId) {
      setModalError('Please select a patient.')
      return
    }
    if (!procedureName.trim()) {
      setModalError('Please enter procedure name.')
      return
    }

    const costPaise = Math.round((parseFloat(estimatedCostInr) || 0) * 100)

    setModalLoading(true)
    try {
      await api.treatments.create({
        patient_id: selectedPatientId,
        procedure_name: procedureName.trim(),
        tooth_number: toothNumber.trim() || undefined,
        estimated_cost_paise: costPaise,
        actual_cost_paise: costPaise,
        status,
        description: description.trim() || undefined,
      })
      setIsModalOpen(false)
      setProcedureName('')
      setToothNumber('')
      setDescription('')
      fetchTreatments()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create treatment')
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateStatus = async (treatmentId: string, newStatus: Treatment['status']) => {
    try {
      await api.treatments.update(treatmentId, { status: newStatus })
      fetchTreatments()
    } catch (err: any) {
      alert(err?.message || 'Failed to update treatment status')
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202421]">Dental Treatments & Procedures</h1>
          <p className="text-xs text-[#6B716D] mt-0.5">
            Track treatment plans, tooth positions, and completion milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan Treatment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E5E0] p-3 rounded flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#6B716D] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAFAF7] border border-[#E2E5E0] rounded px-2.5 py-1 text-xs text-[#202421]"
          >
            <option value="All">All Treatments</option>
            <option value="Planned">Planned</option>
            <option value="In progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={fetchTreatments}
          disabled={loading}
          className="p-1.5 border border-[#E2E5E0] rounded hover:bg-[#FAFAF7] text-[#6B716D]"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030]">
          {error}
        </div>
      )}

      {/* Treatments Table */}
      <div className="bg-white border border-[#E2E5E0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2F3F0] text-[#6B716D] font-semibold border-b border-[#E2E5E0]">
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Procedure Name</th>
                <th className="py-2.5 px-4">Tooth Number</th>
                <th className="py-2.5 px-4">Estimated Cost</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Dates</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B716D]">
                    Loading treatment records from D1...
                  </td>
                </tr>
              ) : treatments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B716D]">
                    <Activity className="w-6 h-6 mx-auto mb-1 text-[#6B716D]/50" />
                    <p className="font-medium text-sm text-[#202421]">No treatments found</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
                    >
                      + Plan a procedure
                    </button>
                  </td>
                </tr>
              ) : (
                treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: t.patient_id })}
                        className="font-semibold text-[#202421] hover:text-[#276B65] hover:underline cursor-pointer text-left block"
                      >
                        {t.patient_name}
                      </button>
                      <span className="text-xs text-[#6B716D] mt-0.5 block">{t.patient_id}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#202421] text-sm">{t.procedure_name}</td>
                    <td className="py-3 px-4 text-[#202421] text-sm">{t.tooth_number || 'General / All'}</td>
                    <td className="py-3 px-4 font-medium text-[#202421] text-sm">
                      {formatCurrency(t.actual_cost_paise || t.estimated_cost_paise)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleUpdateStatus(t.id, e.target.value as Treatment['status'])
                        }
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border cursor-pointer outline-none ${
                          t.status === 'Completed'
                            ? 'bg-[#F0FDF4] text-[#22543D] border-[#22543D]/30'
                            : t.status === 'In progress'
                            ? 'bg-[#EEF5F4] text-[#276B65] border-[#276B65]/30'
                            : t.status === 'Cancelled'
                            ? 'bg-[#FDF2F2] text-[#C53030] border-[#C53030]/30'
                            : 'bg-white text-[#202421] border-[#E2E5E0]'
                        }`}
                      >
                        <option value="Planned">Planned</option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#6B716D]">
                      {t.completion_date ? `Done: ${t.completion_date}` : t.start_date ? `Started: ${t.start_date}` : 'Not started'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('payments', { patientId: t.patient_id, treatmentId: t.id })}
                        className="text-[11px] text-[#276B65] font-semibold hover:underline cursor-pointer"
                      >
                        Bill / Pay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Treatment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-lg p-6 shadow-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#202421] mb-1">Plan Dental Procedure</h3>
            <p className="text-xs text-[#6B716D] mb-4">
              Enter treatment details, tooth position, and procedure quotation.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#C53030]/30 rounded text-xs text-[#C53030]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTreatment} className="space-y-4 text-xs">
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

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Procedure Name *</label>
                <input
                  type="text"
                  required
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Tooth Number (FDI/Universal)</label>
                  <input
                    type="text"
                    value={toothNumber}
                    onChange={(e) => setToothNumber(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Estimated Cost (₹ INR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={estimatedCostInr}
                    onChange={(e) => setEstimatedCostInr(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-2 text-xs text-[#202421]"
                >
                  <option value="Planned">Planned</option>
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E5E0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#E2E5E0] bg-white text-xs text-[#6B716D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {modalLoading ? 'Saving...' : 'Save Treatment Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
