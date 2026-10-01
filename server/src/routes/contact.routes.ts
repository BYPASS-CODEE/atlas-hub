import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { recordAuditLog } from '../utils/audit.js';

export const contactRouter = Router();

contactRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً تمامی فیلدهای فرم تماس (نام، ایمیل، موضوع و متن پیام) را تکمیل نمایید.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'فرمت آدرس ایمیل نامعتبر است.',
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'new', ?)
    `).run(id, name.trim(), email.toLowerCase().trim(), subject.trim(), message.trim(), now);

    recordAuditLog({
      action: 'PUBLIC_CONTACT_MESSAGE_SUBMITTED',
      entityType: 'CONTACT_MESSAGE',
      entityId: id,
      details: { email, subject },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'پیام شما با موفقیت ثبت شد. تیم پشتیبانی اطلس هاب به زودی با شما تماس خواهد گرفت.',
      id,
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطا در ثبت پیام. لطفاً دوباره تلاش نمایید.',
    });
  }
});
