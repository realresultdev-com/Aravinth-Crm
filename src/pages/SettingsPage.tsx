import React, { useEffect, useState } from 'react'
import {
  Settings,
  Building,
  User,
  Shield,
  KeyRound,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  X,
} from 'lucide-react'
import { api } from '../api/client'
import { ClinicSettings, User as UserType, UserRole } from '../types'
import { useAuth } from '../context/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [staffUsers, setStaffUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Edit Settings form
  const [clinicName, setClinicName] = useState('Dr. Aravinth Dental Care')
  const [phone, setPhone] = useState('99526 02577')
  const [email, setEmail] = useState('draravinthsdentalcare2021@gmail.com')
  const [address, setAddress] = useState('Namakkal, Tamil Nadu, India')
  const [defaultDuration, setDefaultDuration] = useState(30)

  // Change Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Add Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [newStaffUsername, setNewStaffUsername] = useState('')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('dentist')
  const [staffModalLoading, setStaffModalLoading] = useState(false)
  const [staffModalError, setStaffModalError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.settings.get()
      setSettings(res.settings)
      setClinicName(res.settings.clinic_name)
      setPhone(res.settings.phone)
      setEmail(res.settings.email)
      setAddress(res.settings.address)
      setDefaultDuration(res.settings.default_appointment_duration)

      if (user?.role === 'admin') {
        const usersRes = await api.settings.getUsers()
        setStaffUsers(usersRes.users)
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMsg(null)
    try {
      await api.settings.update({
        clinic_name: clinicName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        default_appointment_duration: Number(defaultDuration),
      })
      setStatusMsg({ type: 'success', text: 'Clinic settings updated successfully in Cloudflare D1.' })
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdLoading(true)
    setPwdMsg(null)
    try {
      await api.auth.changePassword(currentPassword, newPassword)
      setPwdMsg({ type: 'success', text: 'Password successfully updated via PBKDF2 Web Crypto.' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err?.message || 'Failed to change password' })
    } finally {
      setPwdLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffModalError(null)

    if (!newStaffUsername.trim() || !newStaffPassword.trim() || !newStaffName.trim()) {
      setStaffModalError('All fields are required.')
      return
    }

    setStaffModalLoading(true)
    try {
      await api.settings.createUser({
        username: newStaffUsername.trim(),
        password: newStaffPassword.trim(),
        full_name: newStaffName.trim(),
        role: newStaffRole,
      })
      setIsAddStaffOpen(false)
      setNewStaffUsername('')
      setNewStaffPassword('')
      setNewStaffName('')
      fetchSettings()
    } catch (err: any) {
      setStaffModalError(err?.message || 'Failed to create staff account')
    } finally {
      setStaffModalLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E5E0]">
        <h1 className="text-xl font-bold tracking-tight text-[#202421]">Clinic Settings & Configuration</h1>
        <p className="text-xs text-[#6B716D] mt-0.5">
          Manage clinic contact identity, role-based staff access, and security policies
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-[#F0FDF4] text-[#22543D] border border-[#22543D]/20'
              : 'bg-[#FDF2F2] text-[#C53030] border border-[#C53030]/20'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Section 1: Clinic Profile & Address */}
      <div className="bg-white border border-[#E2E5E0] rounded p-5 space-y-4">
        <div className="pb-3 border-b border-[#E2E5E0] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#276B65] flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            <span>1. Official Clinic Identity (Namakkal)</span>
          </h2>
          {user?.role !== 'admin' && (
            <span className="text-[11px] text-[#6B716D]">View-only (Admin privileges required to edit)</span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#202421] mb-1">Clinic Name</label>
              <input
                type="text"
                disabled={user?.role !== 'admin'}
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] disabled:bg-[#FAFAF7]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#202421] mb-1">Official Phone</label>
              <input
                type="text"
                disabled={user?.role !== 'admin'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] disabled:bg-[#FAFAF7]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#202421] mb-1">Email Address</label>
              <input
                type="email"
                disabled={user?.role !== 'admin'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] disabled:bg-[#FAFAF7]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#202421] mb-1">Default Appointment Slot (Minutes)</label>
              <input
                type="number"
                disabled={user?.role !== 'admin'}
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] disabled:bg-[#FAFAF7]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#202421] mb-1">Clinic Location & Address</label>
              <input
                type="text"
                disabled={user?.role !== 'admin'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421] disabled:bg-[#FAFAF7]"
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white font-semibold cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Updating D1...' : 'Save Clinic Settings'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Section 2: Staff User Management (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="bg-white border border-[#E2E5E0] rounded p-5 space-y-4">
          <div className="pb-3 border-b border-[#E2E5E0] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#276B65] flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>2. Staff User Accounts & Roles</span>
              </h2>
              <p className="text-[11px] text-[#6B716D] mt-0.5">
                Strict role-based permissions enforced by Cloudflare Worker API
              </p>
            </div>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#276B65] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2F3F0] text-[#6B716D] font-semibold border-b border-[#E2E5E0]">
                  <th className="py-2 px-3">Username</th>
                  <th className="py-2 px-3">Full Name</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E5E0]">
                {staffUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAFAF7]">
                    <td className="py-2.5 px-3 font-semibold text-[#202421]">{u.username}</td>
                    <td className="py-2.5 px-3">{u.full_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAFAF7] border border-[#E2E5E0]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[#22543D] font-semibold text-[11px]">Active</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#6B716D]">{u.created_at.split(' ')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Change Password */}
      <div className="bg-white border border-[#E2E5E0] rounded p-5 space-y-4">
        <div className="pb-3 border-b border-[#E2E5E0]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#276B65] flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            <span>3. Account Security (Change Password)</span>
          </h2>
          <p className="text-[11px] text-[#6B716D] mt-0.5">
            Passwords are encrypted using 100,000-iteration PBKDF2 SHA-256 with unique cryptographic salts.
          </p>
        </div>

        {pwdMsg && (
          <div
            className={`p-2.5 rounded text-xs ${
              pwdMsg.type === 'success'
                ? 'bg-[#F0FDF4] text-[#22543D] border border-[#22543D]/20'
                : 'bg-[#FDF2F2] text-[#C53030] border border-[#C53030]/20'
            }`}
          >
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-[#202421] mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#202421] mb-1">New Password (Min 8 characters) *</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white font-semibold cursor-pointer disabled:opacity-60"
          >
            {pwdLoading ? 'Hashing...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-md p-6 shadow-md relative">
            <button
              onClick={() => setIsAddStaffOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#202421] mb-1">Create Staff User</h3>
            <p className="text-xs text-[#6B716D] mb-4">
              Add authorized dentists or receptionist accounts.
            </p>

            {staffModalError && (
              <div className="mb-4 p-2.5 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030]">
                {staffModalError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#202421] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kavin Kumar BDS"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dr.kavin"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Initial Password (Min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-2 text-xs"
                >
                  <option value="dentist">Dentist (Clinical records, procedures)</option>
                  <option value="receptionist">Receptionist (Appointments, registration, payments)</option>
                  <option value="admin">Admin (Full administrative control)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E5E0]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#E2E5E0] bg-white text-[#6B716D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffModalLoading}
                  className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white font-semibold cursor-pointer disabled:opacity-60"
                >
                  {staffModalLoading ? 'Creating User...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
