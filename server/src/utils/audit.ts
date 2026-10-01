import crypto from 'node:crypto';
import { db } from '../database/db.js';

interface AuditLogParams {
  userId?: string | null;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

export function recordAuditLog({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: AuditLogParams): void {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const detailsStr = typeof details === 'object' && details !== null 
      ? JSON.stringify(details) 
      : (details || null);

    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, organization_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId || null,
      organizationId || null,
      action,
      entityType,
      entityId || null,
      detailsStr,
      ipAddress || null,
      createdAt
    );
  } catch (error) {
    console.error('Audit log recording failed:', error);
  }
}
