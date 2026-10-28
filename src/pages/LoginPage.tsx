import React, { useState } from 'react'
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      await login(username, password)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#276B65] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Clinic Wordmark & Header */}
        <div className="text-center">
          <img
            src="/logo.jpg"
            alt="Dr. Aravinth's Dental Care Logo"
            className="w-20 h-20 object-contain mx-auto mb-3 rounded bg-white p-1 border border-[#E2E5E0] shadow-xs"
          />
          <h2 className="text-2xl font-bold tracking-tight text-[#202421]">
            Dr. Aravinth's Dental Care
          </h2>
        </div>

        {/* Login Surface Card */}
        <div className="mt-8 bg-white border border-[#E2E5E0] py-8 px-6 sm:px-10 rounded shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#E2E5E0]">
            <h3 className="text-sm font-semibold text-[#202421]">Staff Sign In</h3>
            <p className="text-xs text-[#6B716D] mt-0.5">
              Authorized clinical and reception staff access only.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded bg-[#FDF2F2] border border-[#C53030]/20 flex items-start gap-2.5 text-xs text-[#C53030]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C53030]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B716D]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username"
                  className="w-full bg-white border border-[#E2E5E0] rounded pl-9 pr-3 py-2 text-xs text-[#202421] placeholder-[#6B716D]/60 focus:outline-none focus:border-[#276B65] focus:ring-1 focus:ring-[#276B65] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202421] mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B716D]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-[#E2E5E0] rounded pl-9 pr-3 py-2 text-xs text-[#202421] placeholder-[#6B716D]/60 focus:outline-none focus:border-[#276B65] focus:ring-1 focus:ring-[#276B65] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to CRM</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
