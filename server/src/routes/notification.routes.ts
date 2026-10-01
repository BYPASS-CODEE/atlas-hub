import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// Get user notifications
notificationRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user!.id) as any).count;

    return res.json({ success: true, notifications, unread_count: unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در دریافت اعلان‌ها.' });
  }
});

// Mark single notification as read
notificationRouter.put('/:id/read', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user!.id);
    return res.json({ success: true, message: 'اعلان خوانده شد.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در علامت‌گذاری اعلان.' });
  }
});

// Mark all as read
notificationRouter.put('/read-all', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
    return res.json({ success: true, message: 'تمامی اعلان‌ها خوانده شدند.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'خطا در بروزرسانی اعلان‌ها.' });
  }
});
