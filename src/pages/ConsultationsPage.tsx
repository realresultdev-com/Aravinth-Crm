import React, { useEffect, useState } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  X,
  User,
  HeartPulse,
  Pill,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { api } from '../api/client'
import { Consultation, Patient } from '../types'
import { NavTab } from '../components/Layout'
import { useAuth } from '../context/AuthContext'

interface ConsultationsPageProps {
  initialPatientId?: string
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function ConsultationsPage({ initialPatientId, onNavigate }: ConsultationsPageProps) {
  const { user } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Record Consultation Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Form state
  const [patientSearch, setPatientSearch] = useState('')
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [clinicalObservations, setClinicalObservations] = useState('')
  const [examinationNotes, setExaminationNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentRecommendation, setTreatmentRecommendation] = useState('')
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [followUpRecommendation, setFollowUpRecommendation] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')

  const fetchConsultations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.consultations.list()
      setConsultations(res.consultations)
    } catch (err: any) {
      setError(err?.message || 'Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsultations()
  }, [])

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

  const handleRecordConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedPatientId) {
      setModalError('Please select a patient.')
      return
    }
    if (!diagnosis.trim()) {
      setModalError('Clinical diagnosis is required.')
      return
    }

    setModalLoading(true)
    try {
      await api.consultations.create({
        patient_id: selectedPatientId,
        chief_complaint: chiefComplaint.trim() || undefined,
        clinical_observations: clinicalObservations.trim() || undefined,
        examination_notes: examinationNotes.trim() || undefined,
        diagnosis: diagnosis.trim(),
        treatment_recommendation: treatmentRecommendation.trim() || undefined,
        prescription_notes: prescriptionNotes.trim() || undefined,
        follow_up_recommendation: followUpRecommendation.trim() || undefined,
        next_review_date: nextReviewDate || undefined,
      })

      setIsModalOpen(false)
      // Reset form
      setChiefComplaint('')
      setClinicalObservations('')
      setExaminationNotes('')
      setDiagnosis('')
      setTreatmentRecommendation('')
      setPrescriptionNotes('')
      setFollowUpRecommendation('')
      setNextReviewDate('')
      fetchConsultations()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save clinical consultation record')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202421]">Clinical Consultations</h1>
          <p className="text-xs text-[#6B716D] mt-0.5">
            Maintain permanent clinical examination records, diagnoses, and prescriptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Consultation</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030]">
          {error}
        </div>
      )}

      {/* Consultations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B716D] bg-white border border-[#E2E5E0] rounded">
            Loading consultations from D1...
          </div>
        ) : consultations.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B716D] bg-white border border-[#E2E5E0] rounded">
            <FileText className="w-6 h-6 mx-auto mb-1 text-[#6B716D]/50" />
            <p className="text-sm font-semibold text-[#202421]">No consultation records found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-[#276B65] font-semibold hover:underline cursor-pointer"
            >
              + Record first consultation
            </button>
          </div>
        ) : (
          consultations.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#E2E5E0] rounded p-5 space-y-3 text-xs hover:border-[#276B65]/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E5E0] gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#276B65]">{c.patient_id}</span>
                  <button
                    onClick={() => onNavigate('patient-profile', { patientId: c.patient_id })}
                    className="font-bold text-[#202421] hover:text-[#276B65] hover:underline cursor-pointer text-sm"
                  >
                    {c.patient_name}
                  </button>
                  <span className="text-[#6B716D]">({c.patient_phone})</span>
                </div>
                <div className="flex items-center gap-3 text-[#6B716D]">
                  <span>Date: {c.consultation_date}</span>
                  <span>•</span>
                  <span>Dentist: {c.dentist_name || 'Dr. Aravinth'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B716D] block">
                    Chief Complaint
                  </span>
                  <p className="text-[#202421] mt-0.5">{c.chief_complaint || 'None specified'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#276B65] block">
                    Clinical Diagnosis
                  </span>
                  <p className="text-[#202421] font-semibold mt-0.5">{c.diagnosis}</p>
                </div>
              </div>

              {c.examination_notes && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B716D] block">
                    Examination & Observations
                  </span>
                  <p className="text-[#202421] mt-0.5">{c.examination_notes}</p>
                </div>
              )}

              {c.treatment_recommendation && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B716D] block">
                    Recommended Treatment Plan
                  </span>
                  <p className="text-[#202421] mt-0.5">{c.treatment_recommendation}</p>
                </div>
              )}

              {c.prescription_notes && (
                <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                  <span className="font-bold text-[#202421] flex items-center gap-1.5 mb-1">
                    <Pill className="w-3.5 h-3.5 text-[#276B65]" />
                    <span>Prescription & Medications</span>
                  </span>
                  <p className="text-[#202421] whitespace-pre-wrap">{c.prescription_notes}</p>
                </div>
              )}

              {c.next_review_date && (
                <div className="text-[11px] text-[#276B65] font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Next Review Scheduled for: {c.next_review_date}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Record Consultation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-2xl p-6 shadow-md relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#202421] mb-1">Record Dental Consultation</h3>
            <p className="text-xs text-[#6B716D] mb-4">
              Enter dentist examination findings, diagnosis, and prescription notes.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#C53030]/30 rounded text-xs text-[#C53030]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRecordConsultation} className="space-y-4 text-xs">
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
                <label className="block font-semibold text-[#202421] mb-1">Chief Dental Complaint</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Clinical Observations & X-Ray Findings</label>
                <textarea
                  rows={2}
                  value={examinationNotes}
                  onChange={(e) => setExaminationNotes(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Assessment / Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Treatment Recommendation</label>
                <textarea
                  rows={2}
                  value={treatmentRecommendation}
                  onChange={(e) => setTreatmentRecommendation(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Prescription Notes</label>
                <textarea
                  rows={2}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E2E5E0]">
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Next Review Date (Optional)</label>
                  <input
                    type="date"
                    value={nextReviewDate}
                    onChange={(e) => setNextReviewDate(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                  <span className="text-[10px] text-[#6B716D]">
                    Auto-schedules a follow-up record for this date
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Follow-up Reason</label>
                  <input
                    type="text"
                    value={followUpRecommendation}
                    onChange={(e) => setFollowUpRecommendation(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E2E5E0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-[#E2E5E0] bg-white text-xs text-[#6B716D] hover:text-[#202421]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {modalLoading ? 'Saving Record...' : 'Save Consultation Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
