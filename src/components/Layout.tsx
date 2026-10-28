import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Activity,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export type NavTab =
  | 'dashboard'
  | 'patients'
  | 'patient-register'
  | 'patient-profile'
  | 'appointments'
  | 'consultations'
  | 'treatments'
  | 'payments'
  | 'settings'

interface LayoutProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab, meta?: any) => void
  children: React.ReactNode
}

export function Layout({ currentTab, onSelectTab, children }: LayoutProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as NavTab, label: 'Patients', icon: Users },
    { id: 'appointments' as NavTab, label: 'Appointments', icon: Calendar },
    { id: 'consultations' as NavTab, label: 'Consultations', icon: FileText },
    { id: 'treatments' as NavTab, label: 'Treatments', icon: Activity },
    { id: 'payments' as NavTab, label: 'Payments & Billing', icon: CreditCard },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ]

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab)
    setMobileMenuOpen(false)
  }

  // Active check (also groups patient profile / register under patients)
  const isTabActive = (id: NavTab) => {
    if (id === currentTab) return true
    if (id === 'patients' && (currentTab === 'patient-register' || currentTab === 'patient-profile')) {
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#202421] flex flex-col md:flex-row font-sans selection:bg-[#276B65] selection:text-white">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-[#E2E5E0] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="Dr. Aravinth's Dental Care Logo"
            className="w-8 h-8 rounded object-contain bg-white border border-[#E2E5E0] shadow-xs"
          />
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-tight text-[#202421]">
              Dr. Aravinth's Dental Care
            </h1>
            <p className="text-[11px] text-[#6B716D]">Patient Management CRM • Namakkal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-[#6B716D] hover:text-[#202421] rounded border border-[#E2E5E0] bg-[#FAFAF7]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Desktop Narrow Sidebar & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E2E5E0] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Wordmark and Clinic Branding Header */}
        <div className="p-5 border-b border-[#E2E5E0]">
          <div className="flex items-start gap-3">
            <img
              src="/logo.jpg"
              alt="Dr. Aravinth's Dental Care Logo"
              className="w-10 h-10 rounded object-contain bg-white border border-[#E2E5E0] shrink-0 shadow-xs"
            />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[#202421] leading-tight">
                Dr. Aravinth's Dental Care
              </h2>
              <p className="text-[11px] font-medium text-[#6B716D] mt-0.5">
                Patient Management CRM
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isTabActive(item.id)
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-[#EEF5F4] text-[#276B65] font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#276B65]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Staff User Profile & Session Footer */}
        <div className="p-3 border-t border-[#E2E5E0] bg-[#FAFAF7]">
          {user && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded bg-white border border-[#E2E5E0] flex items-center justify-center text-[#276B65] shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#202421] truncate leading-none">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] capitalize text-[#6B716D] flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#276B65]" />
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-[#E2E5E0] bg-white text-xs font-medium text-[#6B716D] hover:text-[#C53030] hover:border-[#C53030]/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
        />
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
