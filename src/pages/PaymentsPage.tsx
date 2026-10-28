import React, { useEffect, useState } from 'react'
import {
  CreditCard,
  Plus,
  RefreshCw,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
} from 'lucide-react'
import { api } from '../api/client'
import { Patient, Payment, Treatment } from '../types'
import { NavTab } from '../components/Layout'

interface PaymentsPageProps {
  initialPatientId?: string
  initialTreatmentId?: string
  onNavigate: (tab: NavTab, meta?: any) => void
}

export function PaymentsPage({ initialPatientId, initialTreatmentId, onNavigate }: PaymentsPageProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [collections, setCollections] = useState<{
    today: { total_collected_paise: number; transaction_count: number }
    month: { total_collected_paise: number; total_outstanding_paise: number; transaction_count: number }
    methodBreakdown: Array<{ payment_method: string; total_paise: number; count: number }>
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [receiptModalPayment, setReceiptModalPayment] = useState<Payment | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Record Payment Form
  const [patientSearch, setPatientSearch] = useState('')
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '')
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([])
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(initialTreatmentId || '')

  const [totalAmountInr, setTotalAmountInr] = useState('1000')
  const [amountPaidInr, setAmountPaidInr] = useState('1000')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'>('UPI')
  const [transactionRef, setTransactionRef] = useState('')
  const [notes, setNotes] = useState('')

  const fetchPaymentsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [paymentsRes, collectionsRes] = await Promise.all([
        api.payments.list(),
        api.payments.getCollections(),
      ])
      setPayments(paymentsRes.payments)
      setCollections(collectionsRes)
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  useEffect(() => {
    if (isRecordModalOpen) {
      api.patients.list({ search: patientSearch, limit: 10 }).then((res) => {
        setPatientList(res.patients)
        if (!selectedPatientId && res.patients.length > 0 && !initialPatientId) {
          setSelectedPatientId(res.patients[0].id)
        }
      })
    }
  }, [isRecordModalOpen, patientSearch])

  // Load treatments when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      api.treatments.list({ patientId: selectedPatientId }).then((res) => {
        setTreatmentsList(res.treatments)
        if (res.treatments.length > 0 && !selectedTreatmentId) {
          const t = res.treatments[0]
          setSelectedTreatmentId(t.id)
          const inr = ((t.actual_cost_paise || t.estimated_cost_paise) / 100).toString()
          setTotalAmountInr(inr)
          setAmountPaidInr(inr)
        }
      })
    }
  }, [selectedPatientId])

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedPatientId) {
      setModalError('Please select a patient.')
      return
    }

    const totalPaise = Math.round((parseFloat(totalAmountInr) || 0) * 100)
    const paidPaise = Math.round((parseFloat(amountPaidInr) || 0) * 100)

    if (totalPaise <= 0) {
      setModalError('Total bill amount must be greater than zero.')
      return
    }

    setModalLoading(true)
    try {
      const res = await api.payments.create({
        patient_id: selectedPatientId,
        treatment_id: selectedTreatmentId || undefined,
        total_amount_paise: totalPaise,
        amount_paid_paise: paidPaise,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setIsRecordModalOpen(false)
      // Open receipt modal for printing
      const newPay: Payment = {
        id: res.paymentId,
        patient_id: selectedPatientId,
        receipt_number: res.receiptNumber,
        total_amount_paise: totalPaise,
        amount_paid_paise: paidPaise,
        outstanding_balance_paise: res.outstandingBalancePaise,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        transaction_reference: transactionRef.trim() || null,
        notes: notes.trim() || null,
        created_by: 'Staff',
        created_at: new Date().toISOString(),
        patient_name: patientList.find((p) => p.id === selectedPatientId)?.full_name || 'Patient',
      }
      setReceiptModalPayment(newPay)

      // Refresh list and collection totals
      fetchPaymentsData()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to record payment')
    } finally {
      setModalLoading(false)
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

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E5E0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202421]">Payments & Billing Ledger</h1>
          <p className="text-xs text-[#6B716D] mt-0.5">
            Internal payment recording, receipt numbers, and accurate integer balance calculation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {collections && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white border border-[#E2E5E0] rounded">
            <span className="text-[11px] font-semibold text-[#6B716D] uppercase block">
              Today's Collections
            </span>
            <div className="text-xl font-bold text-[#202421] mt-1">
              {formatCurrency(collections.today.total_collected_paise)}
            </div>
            <span className="text-[10px] text-[#6B716D]">
              {collections.today.transaction_count} transactions recorded today
            </span>
          </div>

          <div className="p-4 bg-white border border-[#E2E5E0] rounded">
            <span className="text-[11px] font-semibold text-[#6B716D] uppercase block">
              Monthly Collections
            </span>
            <div className="text-xl font-bold text-[#276B65] mt-1">
              {formatCurrency(collections.month.total_collected_paise)}
            </div>
            <span className="text-[10px] text-[#6B716D]">
              {collections.month.transaction_count} transactions this month
            </span>
          </div>

          <div className="p-4 bg-white border border-[#E2E5E0] rounded">
            <span className="text-[11px] font-semibold text-[#6B716D] uppercase block">
              Pending Balance Due
            </span>
            <div className="text-xl font-bold text-[#C53030] mt-1">
              {formatCurrency(collections.month.total_outstanding_paise)}
            </div>
            <span className="text-[10px] text-[#6B716D]">Outstanding receivables</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FDF2F2] border border-[#C53030]/20 rounded text-xs text-[#C53030]">
          {error}
        </div>
      )}

      {/* Transactions Ledger Table */}
      <div className="bg-white border border-[#E2E5E0] rounded overflow-hidden">
        <div className="p-3 border-b border-[#E2E5E0] flex items-center justify-between text-xs">
          <h2 className="font-bold text-[#202421]">Transaction History (Cloudflare D1 Ledger)</h2>
          <button
            onClick={fetchPaymentsData}
            disabled={loading}
            className="p-1 border border-[#E2E5E0] rounded text-[#6B716D]"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2F3F0] text-[#6B716D] font-semibold border-b border-[#E2E5E0]">
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Procedure / Purpose</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Amount Paid</th>
                <th className="py-2.5 px-4">Balance</th>
                <th className="py-2.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B716D]">
                    Loading billing ledger from D1...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B716D]">
                    <CreditCard className="w-6 h-6 mx-auto mb-1 text-[#6B716D]/50" />
                    <p className="font-medium text-sm text-[#202421]">No payment transactions recorded yet</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#276B65] text-sm">{p.receipt_number}</td>
                    <td className="py-3 px-4 text-[#6B716D] text-sm">{p.payment_date}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: p.patient_id })}
                        className="font-semibold text-[#202421] hover:text-[#276B65] hover:underline cursor-pointer text-left block text-sm"
                      >
                        {p.patient_name}
                      </button>
                      <span className="text-xs text-[#6B716D] mt-0.5 block">{p.patient_id}</span>
                    </td>
                    <td className="py-3 px-4 text-[#202421] text-sm">{p.procedure_name || 'General Dental Treatment'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAFAF7] border border-[#E2E5E0]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#202421] text-sm">
                      {formatCurrency(p.amount_paid_paise)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {p.outstanding_balance_paise > 0 ? (
                        <span className="text-[#C53030] font-semibold">
                          {formatCurrency(p.outstanding_balance_paise)}
                        </span>
                      ) : (
                        <span className="text-[#22543D]">Settled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setReceiptModalPayment(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#276B65] hover:underline cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-lg p-6 shadow-md relative">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#202421] mb-1">Record Payment Receipt</h3>
            <p className="text-xs text-[#6B716D] mb-4">
              All financial values are calculated server-side in integer minor units (paise).
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#C53030]/30 rounded text-xs text-[#C53030]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202421] mb-1">Select Patient *</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patient..."
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

              {treatmentsList.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Link to Treatment (Optional)</label>
                  <select
                    value={selectedTreatmentId}
                    onChange={(e) => setSelectedTreatmentId(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-2 text-xs text-[#202421]"
                  >
                    <option value="">General Payment / Consultation</option>
                    {treatmentsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.procedure_name} (Tooth {t.tooth_number || 'All'}) — {formatCurrency(t.actual_cost_paise || t.estimated_cost_paise)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Total Bill Amount (₹ INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalAmountInr}
                    onChange={(e) => setTotalAmountInr(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Amount Paid Now (₹ INR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={amountPaidInr}
                    onChange={(e) => setAmountPaidInr(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-2 text-xs text-[#202421]"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#202421] mb-1">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/3948192841/GPay"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-white border border-[#E2E5E0] rounded px-3 py-1.5 text-xs text-[#202421]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202421] mb-1">Internal Billing Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Part payment for crown sitting 1. Balance due on delivery."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#E2E5E0] rounded p-2 text-xs text-[#202421]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E5E0]">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#E2E5E0] bg-white text-xs text-[#6B716D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded bg-[#276B65] hover:bg-[#1e5550] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {modalLoading ? 'Recording Transaction...' : 'Save & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-[#E2E5E0] rounded w-full max-w-lg p-6 shadow-xl relative">
            <button
              onClick={() => setReceiptModalPayment(null)}
              className="absolute top-4 right-4 p-1 text-[#6B716D] hover:text-[#202421] print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Receipt Layout */}
            <div className="text-center pb-4 border-b border-[#E2E5E0]">
              <img
                src="/logo.jpg"
                alt="Dr. Aravinth's Dental Care Logo"
                className="w-14 h-14 object-contain mx-auto mb-2 rounded bg-white"
              />
              <h2 className="text-base font-bold text-[#202421]">Dr. Aravinth's Dental Care</h2>
              <p className="text-xs text-[#6B716D]">Namakkal, Tamil Nadu, India • Phone: 99526 02577</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-[#EEF5F4] text-[#276B65] text-xs font-bold border border-[#276B65]/20">
                OFFICIAL PAYMENT RECEIPT
              </span>
            </div>

            <div className="py-4 space-y-2 text-xs border-b border-[#E2E5E0]">
              <div className="flex justify-between">
                <span className="text-[#6B716D]">Receipt Number:</span>
                <span className="font-bold text-[#202421]">{receiptModalPayment.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B716D]">Date:</span>
                <span className="text-[#202421]">{receiptModalPayment.payment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B716D]">Patient Name:</span>
                <span className="font-semibold text-[#202421]">{receiptModalPayment.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B716D]">Patient ID:</span>
                <span className="text-[#202421]">{receiptModalPayment.patient_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B716D]">Payment Method:</span>
                <span className="font-semibold text-[#202421]">{receiptModalPayment.payment_method}</span>
              </div>
              {receiptModalPayment.transaction_reference && (
                <div className="flex justify-between">
                  <span className="text-[#6B716D]">Transaction Ref:</span>
                  <span className="text-[#202421]">{receiptModalPayment.transaction_reference}</span>
                </div>
              )}
            </div>

            <div className="py-4 space-y-2 text-xs border-b border-[#E2E5E0]">
              <div className="flex justify-between text-[#6B716D]">
                <span>Total Bill Amount:</span>
                <span>{formatCurrency(receiptModalPayment.total_amount_paise)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#276B65]">
                <span>Amount Paid:</span>
                <span>{formatCurrency(receiptModalPayment.amount_paid_paise)}</span>
              </div>
              <div className="flex justify-between font-semibold text-xs text-[#C53030]">
                <span>Outstanding Balance:</span>
                <span>{formatCurrency(receiptModalPayment.outstanding_balance_paise)}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs print:hidden">
              <span className="text-[11px] text-[#6B716D]">Signed by clinic cashier</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalPayment(null)}
                  className="px-3 py-1.5 border border-[#E2E5E0] rounded text-[#6B716D]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#276B65] text-white font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
