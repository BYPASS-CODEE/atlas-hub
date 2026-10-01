import crypto from 'node:crypto';
import { db } from '../database/db.js';

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'urgent' = 'info',
  link?: string
) {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `);
    stmt.run(id, userId, title, message, type, link || null, createdAt);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
