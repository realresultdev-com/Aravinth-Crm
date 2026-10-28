import { generateRandomHex } from './auth'

/**
 * Standard JSON response helper
 */
export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...headers,
    },
  })
}

/**
 * Standard Error response helper
 */
export function errorResponse(message: string, status = 400, details: unknown = null): Response {
  return jsonResponse(
    {
      error: {
        message,
        status,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    status
  )
}

/**
 * Generate unique human-readable Patient ID safely (e.g. DAC-000001)
 */
export async function getNextPatientId(db: D1Database): Promise<string> {
  // Read and increment sequence atomically
  const current = await db
    .prepare('SELECT next_val FROM patient_sequence WHERE id = 1')
    .first<{ next_val: number }>()

  const seqVal = current ? current.next_val : 1
  const nextSeq = seqVal + 1

  await db
    .prepare('UPDATE patient_sequence SET next_val = ? WHERE id = 1')
    .bind(nextSeq)
    .run()

  const padded = seqVal.toString().padStart(6, '0')
  return `DAC-${padded}`
}

/**
 * Log audit events for clinical, demographic, or financial changes
 */
export async function logAudit(
  db: D1Database,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  details: unknown = null,
  ipAddress: string | null = null
): Promise<void> {
  try {
    const id = 'aud_' + generateRandomHex(12)
    const detailsStr = details ? JSON.stringify(details) : null

    await db
      .prepare(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(id, userId, action, entityType, entityId, detailsStr, ipAddress)
      .run()
  } catch (err) {
    // Audit logging should not crash the main transaction, but log in worker console
    console.error('Audit log failure:', err)
  }
}
