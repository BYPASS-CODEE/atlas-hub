import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { hashPassword } from '../utils/auth.js';
import { recordAuditLog } from '../utils/audit.js';

export const teamRouter = Router();

teamRouter.use(authenticate);

// List organization members
teamRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const members = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.avatar_url, u.status, u.phone, u.created_at,
             om.role, om.created_at as joined_at
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
      ORDER BY 
        CASE om.role
          WHEN 'ADMIN' THEN 1
          WHEN 'MANAGER' THEN 2
          WHEN 'TEAM_MEMBER' THEN 3
          WHEN 'CLIENT' THEN 4
        END ASC,
        om.created_at ASC
    `).all(orgId);

    return res.json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست اعضای تیم.' });
  }
});

// Invite / Add team member
teamRouter.post('/invite', requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { email, full_name, role, password, phone } = req.body;

    if (!email || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'ایمیل، نام کامل و نقش کاربری الزامی هستند.' });
    }

    if (!['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ success: false, error: 'نقش کاربری نامعتبر است.' });
    }

    // Only ADMIN can assign ADMIN role
    if (role === 'ADMIN' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'تنها مدیر ارشد می‌تواند نقش مدیر ارشد جدید اعطا کند.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) as { id: string } | undefined;
    let userId = existingUser?.id;

    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      if (!userId) {
        userId = crypto.randomUUID();
        const initialPassword = password || 'Atlas@123456';
        const passwordHash = await hashPassword(initialPassword);

        db.prepare(`
          INSERT INTO users (id, email, password_hash, full_name, role, status, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
        `).run(userId, cleanEmail, passwordHash, full_name.trim(), role, phone?.trim() || null, now, now);
      }

      // Check if already in this organization
      const inOrg = db.prepare('SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?').get(orgId, userId);
      if (inOrg) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ success: false, error: 'این کاربر قبلاً به سازمان افزوده شده است.' });
      }

      const memberId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(memberId, orgId, userId, role, now);

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'USER',
      entityId: userId,
      details: { email: cleanEmail, role },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'عضو جدید با موفقیت به تیم اضافه شد.',
    });
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(500).json({ success: false, error: 'خطا در افزودن عضو جدید.' });
  }
});

// Update member role
teamRouter.put('/:id/role', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ success: false, error: 'نقش نامعتبر است.' });
    }

    if (id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'شما نمی‌توانید نقش خودتان را تغییر دهید.' });
    }

    db.prepare(`
      UPDATE organization_members SET role = ? WHERE user_id = ? AND organization_id = ?
    `).run(role, id, orgId);

    db.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `).run(role, id);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'MEMBER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: id,
      details: { newRole: role },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'نقش کاربر با موفقیت تغییر یافت.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در تغییر نقش کاربر.' });
  }
});

// Remove member
teamRouter.delete('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'امکان حذف حساب کاربری خودتان از این بخش وجود ندارد.' });
    }

    db.prepare('DELETE FROM organization_members WHERE user_id = ? AND organization_id = ?').run(id, orgId);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'MEMBER_REMOVED',
      entityType: 'USER',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'کاربر از سازمان حذف شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در حذف عضو.' });
  }
});
