import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { recordAuditLog } from '../utils/audit.js';

export const adminRouter = Router();

// Strictly enforce authentication and ADMIN role for all routes in this namespace
adminRouter.use(authenticate, requireAdmin);

// System Overview (Real data from database)
adminRouter.get('/overview', (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const totalOrganizations = (db.prepare('SELECT COUNT(*) as count FROM organizations').get() as any).count;
    const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;
    const totalInvoices = (db.prepare('SELECT COUNT(*) as count FROM invoices').get() as any).count;
    const totalTickets = (db.prepare('SELECT COUNT(*) as count FROM support_tickets').get() as any).count;
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const totalAuditLogs = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as rev FROM invoices WHERE status = 'paid'").get() as any).rev;

    // Recent system audit logs
    const recentAuditLogs = db.prepare(`
      SELECT a.*, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    return res.json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_organizations: totalOrganizations,
        total_projects: totalProjects,
        total_invoices: totalInvoices,
        total_tickets: totalTickets,
        total_tasks: totalTasks,
        total_audit_logs: totalAuditLogs,
        total_revenue: totalRevenue,
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      recent_audit_logs: recentAuditLogs,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, error: 'خطا در بارگذاری اطلاعات سامانه مدیریت ارشد.' });
  }
});

// All Users in System
adminRouter.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.role, u.status, u.phone, u.created_at,
             o.name as organization_name
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN organizations o ON om.organization_id = o.id
      ORDER BY u.created_at DESC
    `).all();

    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست کاربران سامانه.' });
  }
});

// Toggle user status (active/suspended)
adminRouter.put('/users/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'وضعیت نامعتبر است.' });
    }

    if (id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'امکان مسدودسازی حساب خودتان وجود ندارد.' });
    }

    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);

    recordAuditLog({
      userId: req.user!.id,
      action: 'ADMIN_USER_STATUS_CHANGED',
      entityType: 'USER',
      entityId: id,
      details: { newStatus: status },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: `وضعیت کاربر با موفقیت به "${status}" تغییر یافت.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در تغییر وضعیت کاربر.' });
  }
});

// Update user role
adminRouter.put('/users/:id/role', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ success: false, error: 'نقش نامعتبر است.' });
    }

    if (id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'امکان تنزل نقش حساب کاربری خودتان وجود ندارد.' });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, new Date().toISOString(), id);
    db.prepare('UPDATE organization_members SET role = ? WHERE user_id = ?').run(role, id);

    recordAuditLog({
      userId: req.user!.id,
      action: 'ADMIN_USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: id,
      details: { newRole: role },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'نقش کاربر تغییر یافت.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در تغییر نقش کاربر.' });
  }
});

// All Organizations
adminRouter.get('/organizations', (req: AuthRequest, res: Response) => {
  try {
    const organizations = db.prepare(`
      SELECT o.*, u.full_name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as members_count,
             (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id) as projects_count,
             (SELECT COUNT(*) FROM invoices i WHERE i.organization_id = o.id) as invoices_count
      FROM organizations o
      LEFT JOIN users u ON o.owner_id = u.id
      ORDER BY o.created_at DESC
    `).all();

    return res.json({ success: true, organizations });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست سازمان‌ها.' });
  }
});

// Full Audit Logs
adminRouter.get('/audit-logs', (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', action } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(10, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT a.*, u.email as user_email, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params: any[] = [];

    if (action && typeof action === 'string' && action.trim()) {
      query += ` WHERE a.action LIKE ?`;
      params.push(`%${action.trim()}%`);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const logs = db.prepare(query).all(...params);
    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;

    return res.json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در بارگذاری گزارشات ممیزی.' });
  }
});
