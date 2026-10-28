import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

// PBKDF2 Web Crypto / Node Crypto test
function pbkdf2Hash(password, saltHex) {
  return crypto.pbkdf2Sync(password, saltHex, 100000, 32, 'sha256').toString('hex')
}

function verifyPassword(password, saltHex, expectedHash) {
  const computed = pbkdf2Hash(password, saltHex)
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash))
}

function checkAppointmentOverlap(existingStart, existingEnd, newStart, newEnd) {
  // Returns true if there is an overlap
  return !(newEnd <= existingStart || newStart >= existingEnd)
}

function calculatePaiseBalances(totalPaise, paidPaise) {
  const outstanding = Math.max(0, totalPaise - paidPaise)
  return {
    totalPaise,
    paidPaise,
    outstandingPaise: outstanding,
  }
}

test('1. Security: PBKDF2 Password Hashing & Verification', () => {
  const salt = '4e3a8ab98c0ab8e42852e7e1d591687e'
  const hash = '9540787b815a7fcf8b3e4ae48101779f1b74bceb6e55461c6527317558d0f5ba'

  assert.equal(verifyPassword('DrAravinth@2026', salt, hash), true, 'Correct password must verify')
  assert.equal(verifyPassword('WrongPassword', salt, hash), false, 'Incorrect password must fail')
})

test('2. Security: Session Token Hashing (SHA-256)', () => {
  const token = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const tokenHash1 = crypto.createHash('sha256').update(token).digest('hex')
  const tokenHash2 = crypto.createHash('sha256').update(token).digest('hex')

  assert.equal(tokenHash1, tokenHash2, 'SHA-256 hash must be deterministic')
  assert.notEqual(token, tokenHash1, 'Plain token must never equal token hash')
})

test('3. Appointment Conflict Detection Algorithm', () => {
  // Existing: 10:00 - 10:30
  const existingStart = '10:00'
  const existingEnd = '10:30'

  // Conflict 1: exact same slot
  assert.equal(checkAppointmentOverlap(existingStart, existingEnd, '10:00', '10:30'), true)

  // Conflict 2: overlapping interior (10:15 - 10:45)
  assert.equal(checkAppointmentOverlap(existingStart, existingEnd, '10:15', '10:45'), true)

  // Conflict 3: engulfing slot (09:45 - 10:45)
  assert.equal(checkAppointmentOverlap(existingStart, existingEnd, '09:45', '10:45'), true)

  // No conflict: strictly before (09:30 - 10:00)
  assert.equal(checkAppointmentOverlap(existingStart, existingEnd, '09:30', '10:00'), false)

  // No conflict: strictly after (10:30 - 11:00)
  assert.equal(checkAppointmentOverlap(existingStart, existingEnd, '10:30', '11:00'), false)
})

test('4. Billing: Integer Minor Units (Paise) Precision & Balance Tracking', () => {
  // Procedure cost: ₹3,500.00 = 350000 paise
  // Paid: ₹2,000.00 = 200000 paise
  // Expected balance: ₹1,500.00 = 150000 paise
  const result = calculatePaiseBalances(350000, 200000)
  assert.equal(result.totalPaise, 350000)
  assert.equal(result.paidPaise, 200000)
  assert.equal(result.outstandingPaise, 150000)

  // Fully paid
  const settled = calculatePaiseBalances(100000, 100000)
  assert.equal(settled.outstandingPaise, 0)

  // Overpayment / tip / roundoff clamp
  const overpaid = calculatePaiseBalances(50000, 60000)
  assert.equal(overpaid.outstandingPaise, 0)
})

test('5. Patient ID Formatting', () => {
  function formatPatientId(seqVal) {
    return `DAC-${seqVal.toString().padStart(6, '0')}`
  }

  assert.equal(formatPatientId(1), 'DAC-000001')
  assert.equal(formatPatientId(42), 'DAC-000042')
  assert.equal(formatPatientId(1025), 'DAC-001025')
})

test('6. Role Authorization Matrix', () => {
  function canEditClinicalNotes(role) {
    return role === 'dentist' || role === 'admin'
  }

  function canManageSettings(role) {
    return role === 'admin'
  }

  function canBookAppointments(role) {
    return ['admin', 'dentist', 'receptionist'].includes(role)
  }

  assert.equal(canEditClinicalNotes('dentist'), true)
  assert.equal(canEditClinicalNotes('admin'), true)
  assert.equal(canEditClinicalNotes('receptionist'), false)

  assert.equal(canManageSettings('admin'), true)
  assert.equal(canManageSettings('dentist'), false)
  assert.equal(canManageSettings('receptionist'), false)

  assert.equal(canBookAppointments('receptionist'), true)
})
