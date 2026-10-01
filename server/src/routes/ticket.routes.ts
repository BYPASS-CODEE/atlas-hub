import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { createNotification } from '../utils/notification.js';
import { recordAuditLog } from '../utils/audit.js';

export const ticketRouter = Router();

ticketRouter.use(authenticate);

// List tickets
ticketRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { status, category, priority, search } = req.query;

    let query = `
      SELECT st.*,
             c.company_name as client_name,
             u.full_name as user_name,
             (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = st.id) as messages_count
      FROM support_tickets st
      LEFT JOIN clients c ON st.client_id = c.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.organization_id = ?
    `;
    const params: any[] = [orgId];

    // If role is CLIENT, they can only see their own tickets or their client_id
    if (req.user!.role === 'CLIENT') {
      query += ` AND st.user_id = ?`;
      params.push(req.user!.id);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND st.status = ?`;
      params.push(status);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND st.category = ?`;
      params.push(category);
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      query += ` AND st.priority = ?`;
      params.push(priority);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (st.ticket_number LIKE ? OR st.subject LIKE ? OR st.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY 
      CASE st.status
        WHEN 'open' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'closed' THEN 4
      END ASC,
      st.created_at DESC
    `;

    const tickets = db.prepare(query).all(...params);
    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('List tickets error:', error);
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست تیکت‌ها.' });
  }
});

// Get single ticket + messages
ticketRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    let ticketQuery = `
      SELECT st.*, c.company_name as client_name, u.full_name as user_name, u.email as user_email
      FROM support_tickets st
      LEFT JOIN clients c ON st.client_id = c.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.id = ? AND st.organization_id = ?
    `;
    const params: any[] = [id, orgId];

    if (req.user!.role === 'CLIENT') {
      ticketQuery += ` AND st.user_id = ?`;
      params.push(req.user!.id);
    }

    const ticket = db.prepare(ticketQuery).get(...params) as any;

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'تیکت مورد نظر یافت نشد یا دسترسی مجاز نیست.' });
    }

    const messages = db.prepare(`
      SELECT tm.*, u.full_name as user_name, u.role as user_role
      FROM ticket_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.ticket_id = ?
      ORDER BY tm.created_at ASC
    `).all(id);

    return res.json({
      success: true,
      ticket: {
        ...ticket,
        messages,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اطلاعات تیکت.' });
  }
});

// Create new ticket
ticketRouter.post('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { client_id, subject, description, category, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, error: 'موضوع و شرح درخواست تیکت الزامی است.' });
    }

    // Auto-generate ticket number TKT-1001, TKT-1002, etc.
    const countRow = db.prepare('SELECT COUNT(*) as count FROM support_tickets WHERE organization_id = ?').get(orgId) as { count: number };
    const ticketNumber = `TKT-${1001 + countRow.count}`;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_tickets (id, organization_id, client_id, user_id, ticket_number, subject, description, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `).run(
      id,
      orgId,
      client_id || null,
      req.user!.id,
      ticketNumber,
      subject.trim(),
      description.trim(),
      category || 'technical',
      priority || 'medium',
      now,
      now
    );

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'TICKET_CREATED',
      entityType: 'SUPPORT_TICKET',
      entityId: id,
      details: { ticketNumber, subject },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'تیکت پشتیبانی با موفقیت ثبت شد.',
      id,
      ticket_number: ticketNumber,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ثبت تیکت پشتیبانی.' });
  }
});

// Add reply message
ticketRouter.post('/:id/messages', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'متن پیام الزامی است.' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'تیکت مورد نظر یافت نشد.' });
    }

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();
    const isStaff = req.user!.role !== 'CLIENT' ? 1 : 0;

    // Relational message insertion
    db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, user_id, message, is_staff_reply, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(messageId, id, req.user!.id, message.trim(), isStaff, now);

    // Update ticket updated_at and status if staff replied
    const newStatus = isStaff && ticket.status === 'open' ? 'in_progress' : ticket.status;
    db.prepare('UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?').run(now, newStatus, id);

    // Notify ticket owner if reply is from staff
    if (isStaff && ticket.user_id !== req.user!.id) {
      createNotification(
        ticket.user_id,
        'پاسخ جدید در تیکت پشتیبانی',
        `به تیکت شماره ${ticket.ticket_number} پاسخ جدیدی افزوده شد.`,
        'info',
        `/app/support/tickets/${id}`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'پاسخ شما با موفقیت ارسال شد.',
      reply: {
        id: messageId,
        ticket_id: id,
        user_id: req.user!.id,
        user_name: req.user!.full_name,
        user_role: req.user!.role,
        message: message.trim(),
        is_staff_reply: Boolean(isStaff),
        created_at: now,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در ثبت پیام.' });
  }
});

// Update ticket status
ticketRouter.put('/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'وضعیت نامعتبر است.' });
    }

    const existing = db.prepare('SELECT id, ticket_number, user_id FROM support_tickets WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'تیکت مورد نظر یافت نشد.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

    if (existing.user_id !== req.user!.id) {
      createNotification(
        existing.user_id,
        'تغییر وضعیت تیکت پشتیبانی',
        `وضعیت تیکت ${existing.ticket_number} به "${status}" تغییر یافت.`,
        'info',
        `/app/support/tickets/${id}`
      );
    }

    return res.json({ success: true, message: 'وضعیت تیکت با موفقیت بروزرسانی شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در بروزرسانی وضعیت تیکت.' });
  }
});
