import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { recordAuditLog } from '../utils/audit.js';

export const clientRouter = Router();

clientRouter.use(authenticate);

// List clients with search and status filters
clientRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { search, status } = req.query;

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as projects_count,
             (SELECT COUNT(*) FROM invoices i WHERE i.client_id = c.id) as invoices_count
      FROM clients c
      WHERE c.organization_id = ?
    `;
    const params: any[] = [orgId];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (c.company_name LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;

    const clients = db.prepare(query).all(...params);
    return res.json({ success: true, clients });
  } catch (error) {
    console.error('List clients error:', error);
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست مشتریان.' });
  }
});

// Get single client
clientRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const client = db.prepare(`
      SELECT * FROM clients WHERE id = ? AND organization_id = ?
    `).get(id, orgId) as any;

    if (!client) {
      return res.status(404).json({ success: false, error: 'مشتری مورد نظر یافت نشد.' });
    }

    const projects = db.prepare(`
      SELECT id, name, status, priority, budget, deadline, created_at
      FROM projects WHERE client_id = ? AND organization_id = ?
      ORDER BY created_at DESC
    `).all(id, orgId);

    const invoices = db.prepare(`
      SELECT id, invoice_number, issue_date, due_date, status, total_amount, currency
      FROM invoices WHERE client_id = ? AND organization_id = ?
      ORDER BY created_at DESC
    `).all(id, orgId);

    return res.json({
      success: true,
      client: {
        ...client,
        projects,
        invoices,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اطلاعات مشتری.' });
  }
});

// Create client
clientRouter.post('/', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { company_name, contact_name, email, phone, address, status, notes } = req.body;

    if (!company_name || !contact_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'نام شرکت، نام نماینده و آدرس ایمیل الزامی هستند.',
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO clients (id, organization_id, company_name, contact_name, email, phone, address, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orgId,
      company_name.trim(),
      contact_name.trim(),
      email.toLowerCase().trim(),
      phone?.trim() || null,
      address?.trim() || null,
      status || 'active',
      notes?.trim() || null,
      now,
      now
    );

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'CLIENT_CREATED',
      entityType: 'CLIENT',
      entityId: id,
      details: { company_name },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'مشتری جدید با موفقیت ثبت شد.',
      id,
    });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ثبت اطلاعات مشتری.' });
  }
});

// Update client
clientRouter.put('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { company_name, contact_name, email, phone, address, status, notes } = req.body;

    const existing = db.prepare('SELECT id FROM clients WHERE id = ? AND organization_id = ?').get(id, orgId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'مشتری مورد نظر یافت نشد.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE clients
      SET company_name = ?, contact_name = ?, email = ?, phone = ?, address = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      company_name.trim(),
      contact_name.trim(),
      email.toLowerCase().trim(),
      phone?.trim() || null,
      address?.trim() || null,
      status || 'active',
      notes?.trim() || null,
      now,
      id,
      orgId
    );

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'CLIENT_UPDATED',
      entityType: 'CLIENT',
      entityId: id,
      details: { company_name },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'اطلاعات مشتری بروزرسانی شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در ویرایش مشتری.' });
  }
});

// Delete client
clientRouter.delete('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    // Check if client has active projects
    const activeProjects = db.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND organization_id = ? AND status != 'completed'
    `).get(id, orgId) as { count: number };

    if (activeProjects.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'امکان حذف این مشتری وجود ندارد؛ زیرا دارای پروژه‌های فعال است. ابتدا پروژه‌ها را تکمیل یا انتقال دهید.',
      });
    }

    db.prepare('DELETE FROM clients WHERE id = ? AND organization_id = ?').run(id, orgId);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'CLIENT_DELETED',
      entityType: 'CLIENT',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'مشتری با موفقیت حذف شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در حذف مشتری.' });
  }
});
