import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { recordAuditLog } from '../utils/audit.js';

export const projectRouter = Router();

projectRouter.use(authenticate);

// List projects
projectRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { search, status, client_id } = req.query;

    let query = `
      SELECT p.*,
             c.company_name as client_name,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as tasks_count,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_tasks_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.organization_id = ?
    `;
    const params: any[] = [orgId];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (client_id && typeof client_id === 'string') {
      query += ` AND p.client_id = ?`;
      params.push(client_id);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR c.company_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY p.created_at DESC`;

    const projects = db.prepare(query).all(...params);
    return res.json({ success: true, projects });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست پروژه‌ها.' });
  }
});

// Get single project
projectRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const project = db.prepare(`
      SELECT p.*, c.company_name as client_name, c.email as client_email, c.phone as client_phone
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ? AND p.organization_id = ?
    `).get(id, orgId) as any;

    if (!project) {
      return res.status(404).json({ success: false, error: 'پروژه مورد نظر یافت نشد.' });
    }

    const tasks = db.prepare(`
      SELECT t.*, u.full_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = ?
      ORDER BY 
        CASE t.status
          WHEN 'todo' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'review' THEN 3
          WHEN 'done' THEN 4
        END ASC,
        t.created_at DESC
    `).all(id);

    const members = db.prepare(`
      SELECT pm.*, u.full_name, u.email, u.role as user_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    return res.json({
      success: true,
      project: {
        ...project,
        tasks,
        members,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اطلاعات پروژه.' });
  }
});

// Create project
projectRouter.post('/', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { name, client_id, description, status, priority, budget, deadline } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'نام پروژه الزامی است.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, organization_id, client_id, name, description, status, priority, budget, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orgId,
      client_id || null,
      name.trim(),
      description?.trim() || null,
      status || 'planning',
      priority || 'medium',
      parseFloat(budget) || 0,
      deadline || null,
      now,
      now
    );

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: id,
      details: { name },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'پروژه جدید با موفقیت ایجاد شد.',
      id,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ایجاد پروژه جدید.' });
  }
});

// Update project
projectRouter.put('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { name, client_id, description, status, priority, budget, deadline } = req.body;

    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND organization_id = ?').get(id, orgId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'پروژه مورد نظر یافت نشد.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE projects
      SET name = ?, client_id = ?, description = ?, status = ?, priority = ?, budget = ?, deadline = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      name.trim(),
      client_id || null,
      description?.trim() || null,
      status || 'planning',
      priority || 'medium',
      parseFloat(budget) || 0,
      deadline || null,
      now,
      id,
      orgId
    );

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: id,
      details: { name, status },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'اطلاعات پروژه بروزرسانی شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در ویرایش پروژه.' });
  }
});

// Delete project
projectRouter.delete('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    db.prepare('DELETE FROM projects WHERE id = ? AND organization_id = ?').run(id, orgId);

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'پروژه با موفقیت حذف گردید.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در حذف پروژه.' });
  }
});
