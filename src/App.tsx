import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout, NavTab } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PatientsPage } from './pages/PatientsPage'
import { PatientRegisterPage } from './pages/PatientRegisterPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { ConsultationsPage } from './pages/ConsultationsPage'
import { TreatmentsPage } from './pages/TreatmentsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { SettingsPage } from './pages/SettingsPage'
import { RefreshCw } from 'lucide-react'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard')
  const [tabMeta, setTabMeta] = useState<any>(null)

  const handleNavigate = (tab: NavTab, meta?: any) => {
    setCurrentTab(tab)
    setTabMeta(meta || null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center text-xs text-[#6B716D]">
        <img
          src="/logo.jpg"
          alt="Dr. Aravinth's Dental Care Logo"
          className="w-16 h-16 object-contain rounded bg-white p-1 border border-[#E2E5E0] shadow-xs mb-3"
        />
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#276B65]" />
          <span>Connecting to Dr. Aravinth's Dental Care CRM...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Layout currentTab={currentTab} onSelectTab={handleNavigate}>
      {currentTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentTab === 'patients' && <PatientsPage onNavigate={handleNavigate} />}
      {currentTab === 'patient-register' && <PatientRegisterPage onNavigate={handleNavigate} />}
      {currentTab === 'patient-profile' && (
        <PatientProfilePage
          patientId={tabMeta?.patientId || 'DAC-000001'}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'appointments' && (
        <AppointmentsPage
          initialPatientId={tabMeta?.patientId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'consultations' && (
        <ConsultationsPage
          initialPatientId={tabMeta?.patientId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'treatments' && (
        <TreatmentsPage
          initialPatientId={tabMeta?.patientId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'payments' && (
        <PaymentsPage
          initialPatientId={tabMeta?.patientId}
          initialTreatmentId={tabMeta?.treatmentId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'settings' && <SettingsPage />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
