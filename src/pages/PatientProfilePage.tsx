import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Activity,
  CreditCard,
  AlertTriangle,
  User,
  HeartPulse,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { api } from '../api/client'
import { Appointment, Consultation, FollowUp, Patient, Payment, Treatment } from '../types'
import { NavTab } from '../components/Layout'

interface PatientProfilePageProps {
  patientId: string
  onNavigate: (tab: NavTab, meta?: any) => void
}

type ProfileTab =
  | 'overview'
  | 'personal'
  | 'medical-dental'
  | 'appointments'
  | 'consultations'
  | 'treatments'
  | 'payments'

export function PatientProfilePage({ patientId, onNavigate }: PatientProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.patients.get(patientId)
      setPatient(res.patient)
      setAppointments(res.appointments)
      setConsultations(res.consultations)
      setTreatments(res.treatments)
      setPayments(res.payments)
      setFollowUps(res.followUps)
    } catch (err: any) {
      setError(err?.message || 'Failed to load patient profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) {
      fetchProfile()
    }
  }, [patientId])

  const formatCurrency = (paise: number) => {
    const inr = paise / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(inr)
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-[#6B716D]">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#276B65]" />
        <span>Loading patient clinical profile...</span>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-6 bg-white border border-[#E2E5E0] rounded text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#C53030] mx-auto" />
        <h2 className="text-sm font-bold text-[#202421]">Could Not Load Patient Profile</h2>
        <p className="text-xs text-[#6B716D]">{error || 'Patient record does not exist.'}</p>
        <button
          onClick={() => onNavigate('patients')}
          className="px-3 py-1.5 rounded bg-[#276B65] text-white text-xs font-semibold cursor-pointer"
        >
          Return to Patient Directory
        </button>
      </div>
    )
  }

  const upcomingAppt = appointments.find(
    (a) => a.appointment_date >= new Date().toISOString().split('T')[0] && a.status !== 'Cancelled'
  )

  const tabs: Array<{ id: ProfileTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Information' },
    { id: 'medical-dental', label: 'Medical & Dental History' },
    { id: 'appointments', label: 'Appointments', count: appointments.length },
    { id: 'consultations', label: 'Consultations', count: consultations.length },
    { id: 'treatments', label: 'Treatments', count: treatments.length },
    { id: 'payments', label: 'Payments', count: payments.length },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header / Profile Overview Card */}
      <div className="bg-white border border-[#E2E5E0] rounded p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onNavigate('patients')}
              className="p-1.5 rounded border border-[#E2E5E0] text-[#6B716D] hover:text-[#202421] transition-colors cursor-pointer mt-0.5"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EEF5F4] text-[#276B65] border border-[#276B65]/20">
                  {patient.id}
                </span>
                <h1 className="text-lg font-bold text-[#202421]">{patient.full_name}</h1>
                <span className="text-xs text-[#6B716D]">
                  ({patient.gender || '—'}, {patient.age ? `${patient.age} yrs` : 'Age N/A'})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B716D] mt-1.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#276B65]" />
                  <span className="text-[#202421]">{patient.phone}</span>
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{patient.email}</span>
                  </span>
                )}
                <span>Registered: {patient.registration_date}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions for this Patient */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('appointments', { patientId: patient.id })}
              className="px-3 py-1.5 rounded border border-[#E2E5E0] bg-white hover:border-[#276B65] text-[#202421] text-xs font-medium cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#276B65]" />
              Schedule Visit
            </button>
            <button
              onClick={() => onNavigate('consultations', { patientId: patient.id })}
              className="px-3 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              New Consultation
            </button>
          </div>
        </div>

        {/* Medical Alert Banner if Allergies or Chronic Illnesses */}
        {patient.allergies && (
          <div className="mt-4 p-2.5 rounded bg-[#FDF2F2] border border-[#C53030]/20 flex items-center gap-2 text-xs text-[#C53030]">
            <AlertTriangle className="w-4 h-4 shrink-0 font-bold" />
            <span>
              <strong>Clinical Allergy Alert:</strong> {patient.allergies}
            </span>
          </div>
        )}

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-2.5 rounded bg-[#FAFAF7] border border-[#E2E5E0]">
            <span className="text-[10px] text-[#6B716D] block font-semibold">Upcoming Visit</span>
            <span className="font-semibold text-[#202421] block truncate">
              {upcomingAppt ? `${upcomingAppt.appointment_date} @ ${upcomingAppt.start_time}` : 'None scheduled'}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#FAFAF7] border border-[#E2E5E0]">
            <span className="text-[10px] text-[#6B716D] block font-semibold">Total Treatments</span>
            <span className="font-semibold text-[#202421] block">{treatments.length} records</span>
          </div>
          <div className="p-2.5 rounded bg-[#FAFAF7] border border-[#E2E5E0]">
            <span className="text-[10px] text-[#6B716D] block font-semibold">Total Payments</span>
            <span className="font-semibold text-[#202421] block">
              {formatCurrency(payments.reduce((acc, p) => acc + p.amount_paid_paise, 0))}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#FAFAF7] border border-[#E2E5E0]">
            <span className="text-[10px] text-[#6B716D] block font-semibold">Balance Due</span>
            <span className="font-semibold text-[#C53030] block">
              {formatCurrency(payments.reduce((acc, p) => acc + p.outstanding_balance_paise, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-[#E2E5E0] flex items-center gap-1 overflow-x-auto text-xs bg-white px-2 rounded-t">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#276B65] text-[#276B65] font-semibold'
                : 'border-transparent text-[#6B716D] hover:text-[#202421]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#F2F3F0] text-[#6B716D]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div className="bg-white border border-[#E2E5E0] rounded p-5">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#276B65]">
                  Chief Complaint & Notes
                </h3>
                <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded text-xs space-y-2">
                  <p>
                    <strong>Complaint:</strong> {patient.chief_complaint || 'None recorded'}
                  </p>
                  <p>
                    <strong>Dentist Clinical Notes:</strong>{' '}
                    {patient.dentist_notes || 'No confidential notes recorded'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#276B65]">
                  Medical History
                </h3>
                <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded text-xs space-y-2">
                  <p>
                    <strong>Systemic Illnesses:</strong> {patient.medical_history || 'None reported'}
                  </p>
                  <p>
                    <strong>Current Medications:</strong> {patient.medications || 'None'}
                  </p>
                  <p className="text-[#C53030]">
                    <strong>Known Allergies:</strong> {patient.allergies || 'No known drug allergies'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Treatments Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#202421]">
                  Active & Recent Treatment Plans
                </h3>
                <button
                  onClick={() => onNavigate('treatments', { patientId: patient.id })}
                  className="text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
                >
                  + Add Procedure
                </button>
              </div>

              {treatments.length === 0 ? (
                <p className="text-xs text-[#6B716D] py-4 text-center bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                  No treatment records planned yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E5E0] border border-[#E2E5E0] rounded overflow-hidden">
                  {treatments.slice(0, 3).map((t) => (
                    <div key={t.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#202421]">{t.procedure_name}</span>
                        {t.tooth_number && (
                          <span className="ml-2 text-[11px] bg-[#F2F3F0] px-1.5 py-0.5 rounded font-medium">
                            Tooth: {t.tooth_number}
                          </span>
                        )}
                        <span className="block text-[11px] text-[#6B716D] mt-0.5">
                          Status: {t.status} • Cost: {formatCurrency(t.actual_cost_paise || t.estimated_cost_paise)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.status === 'Completed'
                            ? 'bg-[#F0FDF4] text-[#22543D]'
                            : t.status === 'In progress'
                            ? 'bg-[#EEF5F4] text-[#276B65]'
                            : 'bg-[#FAFAF7] text-[#6B716D]'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Personal Information */}
        {activeTab === 'personal' && (
          <div className="max-w-2xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#202421] pb-2 border-b border-[#E2E5E0]">
              Patient Contact & Demographic Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#6B716D] block">Full Legal Name</span>
                <span className="font-semibold text-[#202421] text-sm">{patient.full_name}</span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Patient ID</span>
                <span className="font-bold text-[#276B65]">{patient.id}</span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Phone Number</span>
                <span className="font-semibold text-[#202421]">{patient.phone}</span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Email Address</span>
                <span className="text-[#202421]">{patient.email || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Date of Birth & Age</span>
                <span className="text-[#202421]">
                  {patient.dob || 'N/A'} ({patient.age ? `${patient.age} years` : 'Age N/A'})
                </span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Gender</span>
                <span className="text-[#202421]">{patient.gender || 'Not specified'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#6B716D] block">Address</span>
                <span className="text-[#202421]">{patient.address || 'No residential address recorded'}</span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Emergency Contact</span>
                <span className="text-[#202421]">
                  {patient.emergency_name ? `${patient.emergency_name} (${patient.emergency_phone || 'No phone'})` : 'None specified'}
                </span>
              </div>
              <div>
                <span className="text-[#6B716D] block">Registration Date</span>
                <span className="text-[#202421]">{patient.registration_date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Medical & Dental History */}
        {activeTab === 'medical-dental' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#202421] pb-2 border-b border-[#E2E5E0]">
              Clinical Health & Dental History
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                <span className="font-bold text-[#202421] block mb-1">Chief Dental Complaint</span>
                <p className="text-[#6B716D]">{patient.chief_complaint || 'None recorded'}</p>
              </div>
              <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                <span className="font-bold text-[#C53030] block mb-1">Drug Allergies & Sensitivities</span>
                <p className="text-[#202421]">{patient.allergies || 'No known drug allergies'}</p>
              </div>
              <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                <span className="font-bold text-[#202421] block mb-1">Systemic Medical Conditions</span>
                <p className="text-[#6B716D]">{patient.medical_history || 'None reported'}</p>
              </div>
              <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                <span className="font-bold text-[#202421] block mb-1">Current Medications</span>
                <p className="text-[#6B716D]">{patient.medications || 'None'}</p>
              </div>
              <div className="p-3 bg-[#FAFAF7] border border-[#E2E5E0] rounded">
                <span className="font-bold text-[#202421] block mb-1">Past Dental Treatments</span>
                <p className="text-[#6B716D]">{patient.dental_history || 'No past dental history entered'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E0]">
              <h3 className="font-bold text-xs uppercase text-[#202421]">Appointment History</h3>
              <button
                onClick={() => onNavigate('appointments', { patientId: patient.id })}
                className="text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
              >
                + New Appointment
              </button>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-[#6B716D] py-8 text-center">No appointment records found.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F2F3F0] text-[#6B716D] border-b border-[#E2E5E0]">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Reason</th>
                    <th className="p-2.5">Dentist</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E0]">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#FAFAF7]">
                      <td className="p-2.5 font-medium text-[#202421]">{a.appointment_date}</td>
                      <td className="p-2.5 font-medium">{a.start_time} - {a.end_time}</td>
                      <td className="p-2.5">{a.reason}</td>
                      <td className="p-2.5">{a.dentist_name || 'Dr. Aravinth'}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAFAF7] border border-[#E2E5E0]">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 5: Consultations */}
        {activeTab === 'consultations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E0]">
              <h3 className="font-bold text-xs uppercase text-[#202421]">Clinical Consultations</h3>
              <button
                onClick={() => onNavigate('consultations', { patientId: patient.id })}
                className="text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
              >
                + Record Consultation
              </button>
            </div>

            {consultations.length === 0 ? (
              <p className="text-xs text-[#6B716D] py-8 text-center">No consultations recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {consultations.map((c) => (
                  <div key={c.id} className="p-4 bg-[#FAFAF7] border border-[#E2E5E0] rounded space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E2E5E0] pb-2">
                      <span className="font-bold text-[#202421]">Date: {c.consultation_date}</span>
                      <span className="text-[#6B716D]">Dentist: {c.dentist_name || 'Dr. Aravinth'}</span>
                    </div>
                    <div>
                      <strong className="text-[#202421]">Clinical Diagnosis:</strong>{' '}
                      <span className="text-[#276B65] font-semibold">{c.diagnosis}</span>
                    </div>
                    {c.clinical_observations && (
                      <p>
                        <strong>Observations:</strong> {c.clinical_observations}
                      </p>
                    )}
                    {c.examination_notes && (
                      <p>
                        <strong>Examination / X-ray:</strong> {c.examination_notes}
                      </p>
                    )}
                    {c.treatment_recommendation && (
                      <p>
                        <strong>Treatment Plan:</strong> {c.treatment_recommendation}
                      </p>
                    )}
                    {c.prescription_notes && (
                      <div className="p-2 bg-white rounded border border-[#E2E5E0]">
                        <strong>Prescription:</strong> {c.prescription_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Treatments */}
        {activeTab === 'treatments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E0]">
              <h3 className="font-bold text-xs uppercase text-[#202421]">Dental Procedures & Treatments</h3>
              <button
                onClick={() => onNavigate('treatments', { patientId: patient.id })}
                className="text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
              >
                + Add Treatment
              </button>
            </div>

            {treatments.length === 0 ? (
              <p className="text-xs text-[#6B716D] py-8 text-center">No dental procedures recorded.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F2F3F0] text-[#6B716D] border-b border-[#E2E5E0]">
                    <th className="p-2.5">Procedure</th>
                    <th className="p-2.5">Tooth #</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Cost</th>
                    <th className="p-2.5">Start Date</th>
                    <th className="p-2.5">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E0]">
                  {treatments.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FAFAF7]">
                      <td className="p-2.5 font-semibold text-[#202421]">{t.procedure_name}</td>
                      <td className="p-2.5">{t.tooth_number || '—'}</td>
                      <td className="p-2.5">{t.status}</td>
                      <td className="p-2.5 font-medium">{formatCurrency(t.actual_cost_paise || t.estimated_cost_paise)}</td>
                      <td className="p-2.5 text-[#6B716D]">{t.start_date || '—'}</td>
                      <td className="p-2.5 text-[#6B716D]">{t.completion_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 7: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E0]">
              <h3 className="font-bold text-xs uppercase text-[#202421]">Payment Receipts & Ledger</h3>
              <button
                onClick={() => onNavigate('payments', { patientId: patient.id })}
                className="text-xs text-[#276B65] font-semibold hover:underline cursor-pointer"
              >
                + Record Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-[#6B716D] py-8 text-center">No payment transactions found.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F2F3F0] text-[#6B716D] border-b border-[#E2E5E0]">
                    <th className="p-2.5">Receipt #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Amount Paid</th>
                    <th className="p-2.5">Outstanding</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E0]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFAF7]">
                      <td className="p-2.5 font-bold text-[#276B65]">{p.receipt_number}</td>
                      <td className="p-2.5">{p.payment_date}</td>
                      <td className="p-2.5 font-semibold text-[#202421]">{formatCurrency(p.amount_paid_paise)}</td>
                      <td className="p-2.5 text-[#C53030]">{formatCurrency(p.outstanding_balance_paise)}</td>
                      <td className="p-2.5">{p.payment_method}</td>
                      <td className="p-2.5 text-[#6B716D]">{p.created_by_name || 'Staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
