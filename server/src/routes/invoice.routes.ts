import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { recordAuditLog } from '../utils/audit.js';

export const invoiceRouter = Router();

invoiceRouter.use(authenticate);

// List invoices
invoiceRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { status, client_id, search } = req.query;

    let query = `
      SELECT i.*,
             c.company_name as client_name,
             p.name as project_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.organization_id = ?
    `;
    const params: any[] = [orgId];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (client_id && typeof client_id === 'string' && client_id !== 'all') {
      query += ` AND i.client_id = ?`;
      params.push(client_id);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (i.invoice_number LIKE ? OR c.company_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY i.created_at DESC`;

    const invoices = db.prepare(query).all(...params);
    return res.json({ success: true, invoices });
  } catch (error) {
    console.error('List invoices error:', error);
    return res.status(500).json({ success: false, error: 'خطا در دریافت لیست فاکتورها.' });
  }
});

// Get single invoice
invoiceRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const invoice = db.prepare(`
      SELECT i.*,
             c.company_name as client_name,
             c.contact_name as client_contact,
             c.email as client_email,
             c.phone as client_phone,
             c.address as client_address,
             p.name as project_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ? AND i.organization_id = ?
    `).get(id, orgId) as any;

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'فاکتور مورد نظر یافت نشد.' });
    }

    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY rowid ASC
    `).all(id);

    const payments = db.prepare(`
      SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC
    `).all(id);

    return res.json({
      success: true,
      invoice: {
        ...invoice,
        items,
        payments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اطلاعات فاکتور.' });
  }
});

// Create invoice
invoiceRouter.post('/', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { client_id, project_id, issue_date, due_date, tax_rate, notes, currency, items } = req.body;

    if (!client_id || !issue_date || !due_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً مشتری، تاریخ صدور، سررسید و حداقل یک ردیف فاکتور را مشخص نمایید.',
      });
    }

    // Verify client belongs to org
    const client = db.prepare('SELECT id FROM clients WHERE id = ? AND organization_id = ?').get(client_id, orgId);
    if (!client) {
      return res.status(400).json({ success: false, error: 'مشتری انتخاب شده نامعتبر است.' });
    }

    // Calculate subtotal, tax and total
    let subtotal = 0;
    const calculatedItems = items.map((item: any) => {
      const qty = Math.max(1, parseFloat(item.quantity) || 1);
      const price = Math.max(0, parseFloat(item.unit_price) || 0);
      const total = qty * price;
      subtotal += total;
      return {
        id: crypto.randomUUID(),
        description: item.description?.trim() || 'خدمات یا کالای مربوطه',
        quantity: qty,
        unit_price: price,
        total,
      };
    });

    const parsedTaxRate = Math.max(0, parseFloat(tax_rate) || 0);
    const taxAmount = (subtotal * parsedTaxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate unique invoice number: INV-2026-101
    const countRow = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE organization_id = ?').get(orgId) as { count: number };
    const invoiceNumber = `INV-${new Date().getFullYear()}-${1001 + countRow.count}`;

    const invoiceId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO invoices (
          id, organization_id, client_id, project_id, invoice_number,
          issue_date, due_date, status, subtotal, tax_rate, tax_amount, total_amount, currency, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        orgId,
        client_id,
        project_id || null,
        invoiceNumber,
        issue_date,
        due_date,
        subtotal,
        parsedTaxRate,
        taxAmount,
        totalAmount,
        currency || 'تومان',
        notes?.trim() || null,
        now,
        now
      );

      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of calculatedItems) {
        itemStmt.run(item.id, invoiceId, item.description, item.quantity, item.unit_price, item.total, now);
      }

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'INVOICE_CREATED',
      entityType: 'INVOICE',
      entityId: invoiceId,
      details: { invoiceNumber, totalAmount },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'فاکتور جدید با موفقیت صادر گردید.',
      id: invoiceId,
      invoice_number: invoiceNumber,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ثبت فاکتور.' });
  }
});

// Update invoice status
invoiceRouter.put('/:id/status', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'وضعیت نامعتبر است.' });
    }

    const existing = db.prepare('SELECT id FROM invoices WHERE id = ? AND organization_id = ?').get(id, orgId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'فاکتور مورد نظر یافت نشد.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

    return res.json({ success: true, message: 'وضعیت فاکتور تغییر یافت.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در بروزرسانی وضعیت فاکتور.' });
  }
});

// Record Payment
invoiceRouter.post('/:id/payments', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { amount, payment_method, payment_date, reference_id, notes } = req.body;

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'فاکتور مورد نظر یافت نشد.' });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'مبلغ پرداختی نامعتبر است.' });
    }

    const paymentId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO payments (id, invoice_id, organization_id, amount, payment_method, payment_date, reference_id, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        id,
        orgId,
        parsedAmount,
        payment_method || 'انتقال بانکی / کارت به کارت',
        payment_date || now.split('T')[0],
        reference_id || null,
        notes || null,
        now
      );

      // Check sum of payments for this invoice
      const paidRow = db.prepare('SELECT SUM(amount) as paid_sum FROM payments WHERE invoice_id = ?').get(id) as { paid_sum: number };
      if (paidRow.paid_sum >= invoice.total_amount) {
        db.prepare("UPDATE invoices SET status = 'paid', updated_at = ? WHERE id = ?").run(now, id);
      }

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    recordAuditLog({
      userId: req.user!.id,
      organizationId: orgId,
      action: 'PAYMENT_RECORDED',
      entityType: 'PAYMENT',
      entityId: paymentId,
      details: { invoiceId: id, amount: parsedAmount },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'پرداخت با موفقیت ثبت شد.',
      id: paymentId,
    });
  } catch (error) {
    console.error('Payment record error:', error);
    return res.status(500).json({ success: false, error: 'خطا در ثبت پرداخت.' });
  }
});

// Delete invoice (draft only)
invoiceRouter.delete('/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const existing = db.prepare('SELECT status FROM invoices WHERE id = ? AND organization_id = ?').get(id, orgId) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'فاکتور مورد نظر یافت نشد.' });
    }

    if (existing.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'صرفاً فاکتورهای در حالت پیش‌نویس (Draft) امکان حذف دارند. برای سایر فاکتورها از گزینه لغو (Cancelled) استفاده نمایید.',
      });
    }

    db.prepare('DELETE FROM invoices WHERE id = ? AND organization_id = ?').run(id, orgId);

    return res.json({ success: true, message: 'فاکتور پیش‌نویس با موفقیت حذف شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در حذف فاکتور.' });
  }
});
