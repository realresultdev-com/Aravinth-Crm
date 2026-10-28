import React, { useState } from 'react'
import {
  UserPlus,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  HeartPulse,
  Save,
  Phone,
  Mail,
  Calendar,
  User,
  MapPin,
} from 'lucide-react'
import { api } from '../api/client'
import { NavTab } from '../components/Layout'

interface PatientRegisterPageProps {
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function PatientRegisterPage({ onNavigate }: PatientRegisterPageProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string
    existingPatient: any
  } | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ patientId: string } | null>(null)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('')
  const [address, setAddress] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  // Dental & Medical Clinical Fields
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [dentalHistory, setDentalHistory] = useState('')
  const [previousTreatments, setPreviousTreatments] = useState('')
  const [dentistNotes, setDentistNotes] = useState('')

  // Auto calculate age when DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDob(val)
    if (val) {
      const birthYear = new Date(val).getFullYear()
      const currentYear = new Date().getFullYear()
      if (!isNaN(birthYear)) {
        setAge(Math.max(0, currentYear - birthYear).toString())
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent, forceDuplicate = false) => {
    if (e) e.preventDefault()
    setErrorMsg(null)

    // Form validations
    if (!fullName.trim()) {
      setErrorMsg('Patient full name is required.')
      return
    }
    if (!phone.trim()) {
      setErrorMsg('Patient contact phone number is required.')
      return
    }

    // Basic email validation if entered
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address or leave it blank.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        dob: dob || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        address: address.trim() || undefined,
        emergency_name: emergencyName.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        chief_complaint: chiefComplaint.trim() || undefined,
        medical_history: medicalHistory.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medications: medications.trim() || undefined,
        dental_history: dentalHistory.trim() || undefined,
        previous_treatments: previousTreatments.trim() || undefined,
        dentist_notes: dentistNotes.trim() || undefined,
      }

      const res = await api.patients.create(payload, forceDuplicate)
      setDuplicateWarning(null)
      setSuccessInfo({ patientId: res.patientId })
    } catch (err: any) {
      if (err?.warning === 'duplicate_detected' || err?.status === 409) {
        setDuplicateWarning({
          message: err.message,
          existingPatient: err.existingPatient,
        })
      } else {
        setErrorMsg(err?.message || 'Failed to save patient record to Cloudflare D1.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (successInfo) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#E2E5E0] p-8 rounded text-center">
        <div className="w-12 h-12 rounded-full bg-[#EEF5F4] text-[#276B65] flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#202421]">Patient Registered Successfully!</h2>
        <p className="text-xs text-[#6B716D] mt-1">
          Patient record has been confirmed and saved to Cloudflare D1 database.
        </p>

        <div className="my-6 p-4 bg-[#FAFAF7] border border-[#E2E5E0] rounded inline-block text-left">
          <span className="text-[11px] font-semibold text-[#6B716D] block">Assigned Patient ID</span>
          <span className="text-xl font-bold text-[#276B65]">{successInfo.patientId}</span>
          <span className="block text-xs text-[#202421] font-semibold mt-1">{fullName}</span>
          <span className="block text-[11px] text-[#6B716D]">{phone}</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('patient-profile', { patientId: successInfo.patientId })}
            className="px-4 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Open Patient Profile
          </button>
          <button
            onClick={() => {
              setSuccessInfo(null)
              setFullName('')
              setPhone('')
              setEmail('')
              setDob('')
              setAge('')
              setGender('')
              setAddress('')
              setChiefComplaint('')
              setMedicalHistory('')
              setAllergies('')
              setMedications('')
              setDentalHistory('')
              setPreviousTreatments('')
              setDentistNotes('')
            }}
            className="px-4 py-2 rounded border border-[#E2E5E0] bg-white text-[#202421] text-xs font-medium hover:border-[#276B65] cursor-pointer"
          >
            Register Another Patient
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E5E0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('patients')}
            className="p-1.5 rounded border border-[#E2E5E0] text-[#6B716D] hover:text-[#202421] hover:border-[#202421] transition-colors cursor-pointer"
            title="Back to patient directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#202421]">New Patient Registration</h1>
            <p className="text-xs text-[#6B716D]">
              Record patient demographics, emergency contact, and dental-specific medical history
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Dialog / Banner */}
      {duplicateWarning && (
        <div className="p-4 rounded bg-[#FFFBEB] border border-[#F59E0B]/40 text-xs text-[#92400E] space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-[#92400E]">Duplicate Record Warning</h3>
              <p className="mt-0.5">{duplicateWarning.message}</p>
              {duplicateWarning.existingPatient && (
                <div className="mt-2 p-2 bg-white/80 rounded border border-[#F59E0B]/20 text-[11px]">
                  <strong>Existing Record:</strong> {duplicateWarning.existingPatient.full_name} (ID:{' '}
                  {duplicateWarning.existingPatient.id}) • Registered:{' '}
                  {duplicateWarning.existingPatient.registration_date}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#F59E0B]/20">
            <button
              type="button"
              onClick={() => onNavigate('patient-profile', { patientId: duplicateWarning.existingPatient?.id })}
              className="px-3 py-1.5 rounded bg-white border border-[#D97706]/40 text-[#92400E] font-semibold text-xs hover:bg-[#FEF3C7] cursor-pointer"
            >
              Open Existing Patient
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, true)}
              className="px-3 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs cursor-pointer"
            >
              Proceed Anyway (Create Separate Record)
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 text-xs text-[#92400E] hover:underline ml-auto cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="bg-white border border-[#E2E5E0] rounded p-5 space-y-4">
          <div className="pb-3 border-b border-[#E2E5E0] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#276B65] flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>1. Patient Demographics & Contact</span>
            </h2>
            <span className="text-[11px] text-[#6B716D]">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Senthil Kumar M"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98421 11223"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. patient@example.com"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={handleDobChange}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Auto-calculated or enter"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14/B Trichy Road, Mohanur, Namakkal"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Spouse / Parent / Guardian"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Emergency phone number"
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dental Specific Clinical Details */}
        <div className="bg-white border border-[#E2E5E0] rounded p-5 space-y-4">
          <div className="pb-3 border-b border-[#E2E5E0]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#276B65] flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4" />
              <span>2. Dental Care & Medical History</span>
            </h2>
            <p className="text-[11px] text-[#6B716D] mt-0.5">
              Essential for clinical safety, anesthesia suitability, and treatment planning
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Chief Dental Complaint
              </label>
              <textarea
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Reason for visit, symptoms, duration, location of pain or discomfort..."
                className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202421] mb-1">
                  Medical History (Diabetes, BP, Cardiac, Bleeding Disorders)
                </label>
                <textarea
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes (HbA1c 6.8), Hypertension..."
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C53030] mb-1">
                  Known Drug Allergies (Penicillin, Local Anesthetics, Latex)
                </label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin allergy, Sulfa drugs, or 'None'"
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#C53030]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202421] mb-1">
                  Current Medications (Blood thinners, insulin, etc.)
                </label>
                <textarea
                  rows={2}
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="List regular prescriptions and dosages"
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202421] mb-1">
                  Previous Dental Treatments & Oral History
                </label>
                <textarea
                  rows={2}
                  value={dentalHistory}
                  onChange={(e) => setDentalHistory(e.target.value)}
                  placeholder="Past fillings, extractions, RCTs, or adverse anesthetic reactions..."
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Internal Notes for Dentist
              </label>
              <textarea
                rows={2}
                value={dentistNotes}
                onChange={(e) => setDentistNotes(e.target.value)}
                placeholder="Clinical observations, patient anxiety notes, or special handling instructions..."
                className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421] focus:outline-none focus:border-[#276B65]"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate('patients')}
            className="px-4 py-2 rounded border border-[#E2E5E0] bg-white text-xs font-medium text-[#6B716D] hover:text-[#202421] hover:border-[#202421] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving to Database...' : 'Save & Register Patient'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
