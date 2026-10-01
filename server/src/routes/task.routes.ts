import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { createNotification } from '../utils/notification.js';
import { recordAuditLog } from '../utils/audit.js';

export const taskRouter = Router();

taskRouter.use(authenticate);

// List tasks
taskRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { project_id, status, priority, assignee_id, search } = req.query;

    let query = `
      SELECT t.*,
             p.name as project_name,
             u.full_name as assignee_name,
             (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) as comments_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.organization_id = ?
    `;
    const params: any[] = [orgId];

    if (project_id && typeof project_id === 'string' && project_id !== 'all') {
      query += ` AND t.project_id = ?`;
      params.push(project_id);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (assignee_id && typeof assignee_id === 'string' && assignee_id !== 'all') {
      query += ` AND t.assignee_id = ?`;
      params.push(assignee_id);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY 
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END ASC,
      t.created_at DESC
    `;

    const tasks = db.prepare(query).all(...params);
    return res.json({ success: true, tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست تسک‌ها.' });
  }
});

// Get single task
taskRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const task = db.prepare(`
      SELECT t.*, p.name as project_name, u.full_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ? AND t.organization_id = ?
    `).get(id, orgId) as any;

    if (!task) {
      return res.status(404).json({ success: false, error: 'تسک مورد نظر یافت نشد.' });
    }

    const comments = db.prepare(`
      SELECT tc.*, u.full_name as user_name, u.role as user_role
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).all(id);

    return res.json({
      success: true,
      task: {
        ...task,
        comments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اطلاعات تسک.' });
  }
});

// Create task
taskRouter.post('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { project_id, title, description, status, priority, assignee_id, due_date } = req.body;

    if (!project_id || !title || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'انتخاب پروژه و عنوان تسک الزامی است.' });
    }

    // Verify project belongs to organization
    const project = db.prepare('SELECT id, name FROM projects WHERE id = ? AND organization_id = ?').get(project_id, orgId) as any;
    if (!project) {
      return res.status(400).json({ success: false, error: 'پروژه مشخص شده یافت نشد.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (id, project_id, organization_id, title, description, status, priority, assignee_id, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project_id,
      orgId,
      title.trim(),
      description?.trim() || null,
      status || 'todo',
      priority || 'medium',
      assignee_id || null,
      due_date || null,
      now,
      now
    );

    // If assigned to a user, send notification
    if (assignee_id && assignee_id !== req.user!.id) {
      createNotification(
        assignee_id,
        'تسک جدید به شما محول شد',
        `تسک "${title.trim()}" در پروژه "${project.name}" برای شما ایجاد شد.`,
        priority === 'urgent' ? 'urgent' : 'info',
        `/app/tasks`
      );
    }

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: id,
      details: { title, project_id },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'تسک با موفقیت ایجاد شد.',
      id,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ایجاد تسک.' });
  }
});

// Update task
taskRouter.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { title, description, status, priority, assignee_id, due_date } = req.body;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'تسک مورد نظر یافت نشد.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      title ? title.trim() : existing.title,
      description !== undefined ? description?.trim() || null : existing.description,
      status || existing.status,
      priority || existing.priority,
      assignee_id !== undefined ? assignee_id || null : existing.assignee_id,
      due_date !== undefined ? due_date || null : existing.due_date,
      now,
      id,
      orgId
    );

    // Notify assignee if changed
    if (assignee_id && assignee_id !== existing.assignee_id && assignee_id !== req.user!.id) {
      createNotification(
        assignee_id,
        'تسک به شما واگذار شد',
        `تسک "${existing.title}" به شما اختصاص داده شد.`,
        'info',
        `/app/tasks`
      );
    }

    return res.json({ success: true, message: 'تسک با موفقیت بروزرسانی شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در ویرایش تسک.' });
  }
});

// Delete task
taskRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    db.prepare('DELETE FROM tasks WHERE id = ? AND organization_id = ?').run(id, orgId);

    return res.json({ success: true, message: 'تسک با موفقیت حذف گردید.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در حذف تسک.' });
  }
});

// Add comment to task
taskRouter.post('/:id/comments', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'متن دیدگاه نمی‌تواند خالی باشد.' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!task) {
      return res.status(404).json({ success: false, error: 'تسک مورد نظر یافت نشد.' });
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO task_comments (id, task_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, id, req.user!.id, content.trim(), now);

    // Notify task assignee if commenter is someone else
    if (task.assignee_id && task.assignee_id !== req.user!.id) {
      createNotification(
        task.assignee_id,
        'دیدگاه جدید در تسک',
        `${req.user!.full_name} در تسک "${task.title}" دیدگاه جدیدی ثبت کرد.`,
        'info',
        `/app/tasks`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'دیدگاه با موفقیت ثبت شد.',
      comment: {
        id: commentId,
        task_id: id,
        user_id: req.user!.id,
        user_name: req.user!.full_name,
        user_role: req.user!.role,
        content: content.trim(),
        created_at: now,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در ثبت دیدگاه.' });
  }
});
