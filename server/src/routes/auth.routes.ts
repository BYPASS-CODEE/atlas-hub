import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { hashPassword, comparePassword, signToken } from '../utils/auth.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { recordAuditLog } from '../utils/audit.js';

export const authRouter = Router();

// Register new user + workspace
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, company_name, phone } = req.body;

    if (!email || !password || !full_name || !company_name) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً تمامی فیلدهای الزامی (نام، ایمیل، کلمه عبور و نام شرکت) را تکمیل نمایید.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'کلمه عبور باید حداقل ۸ کاراکتر باشد.',
      });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'کاربری با این آدرس ایمیل قبلاً در سیستم ثبت نام کرده است.',
      });
    }

    // Count existing users: if this is the very first user in the whole platform, make them ADMIN, otherwise MANAGER
    const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const role = userCountRow.count === 0 ? 'ADMIN' : 'MANAGER';

    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const orgMemberId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);
    const slug = company_name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    // Relational insertions inside transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, status, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).run(userId, email.toLowerCase().trim(), passwordHash, full_name.trim(), role, phone?.trim() || null, now, now);

      db.prepare(`
        INSERT INTO organizations (id, name, slug, plan, owner_id, created_at, updated_at)
        VALUES (?, ?, ?, 'standard', ?, ?, ?)
      `).run(orgId, company_name.trim(), slug, userId, now, now);

      db.prepare(`
        INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(orgMemberId, orgId, userId, role, now);

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    recordAuditLog({
      userId,
      organizationId: orgId,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      details: { email, role, company_name },
      ipAddress: req.ip,
    });

    const token = signToken({
      userId,
      email: email.toLowerCase().trim(),
      role,
      organizationId: orgId,
    });

    return res.status(201).json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role,
        status: 'active',
        phone: phone?.trim() || null,
        organization_id: orgId,
        company_name: company_name.trim(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطای سرور در فرآیند ثبت‌نام. لطفاً دوباره تلاش نمایید.',
    });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً ایمیل و کلمه عبور را وارد نمایید.',
      });
    }

    const user = db.prepare(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.status, u.avatar_url, u.phone,
             COALESCE(om.organization_id, '') as organization_id,
             COALESCE(o.name, '') as company_name
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN organizations o ON om.organization_id = o.id
      WHERE u.email = ?
    `).get(email.toLowerCase().trim()) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'اطلاعات ورود نادرست است.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'حساب کاربری شما مسدود یا غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.',
      });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'اطلاعات ورود نادرست است.',
      });
    }

    recordAuditLog({
      userId: user.id,
      organizationId: user.organization_id || null,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    });

    return res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        phone: user.phone,
        organization_id: user.organization_id,
        company_name: user.company_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطای سرور در فرآیند ورود.',
    });
  }
});

// Current User info
authRouter.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const org = db.prepare('SELECT name, plan FROM organizations WHERE id = ?').get(user.organization_id) as any;

  return res.json({
    success: true,
    user: {
      ...user,
      company_name: org ? org.name : '',
      plan: org ? org.plan : 'standard',
    },
  });
});

// Update Profile
authRouter.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'نام و نام خانوادگی الزامی است.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?
    `).run(full_name.trim(), phone?.trim() || null, now, req.user!.id);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: req.user!.organization_id,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'USER',
      entityId: req.user!.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'پروفایل با موفقیت بروزرسانی شد.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در بروزرسانی پروفایل.' });
  }
});

// Update Password
authRouter.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'تمامی فیلدها الزامی هستند.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'کلمه عبور جدید باید حداقل ۸ کاراکتر باشد.' });
    }

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as { password_hash: string };
    const isValid = await comparePassword(current_password, row.password_hash);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'کلمه عبور فعلی نادرست است.' });
    }

    const newHash = await hashPassword(new_password);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, req.user!.id);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: req.user!.organization_id,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: req.user!.id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'کلمه عبور با موفقیت تغییر یافت.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در تغییر کلمه عبور.' });
  }
});
