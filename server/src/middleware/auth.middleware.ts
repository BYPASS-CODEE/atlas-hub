import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';
import { db } from '../database/db.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  organization_id: string;
  avatar_url?: string;
  phone?: string;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'احراز هویت انجام نشده است. لطفاً وارد سیستم شوید.',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'نشست کاربری نامعتبر یا منقضی شده است.',
    });
  }

  // Fetch active user and primary organization
  const userStmt = db.prepare(`
    SELECT u.id, u.email, u.full_name, u.role, u.status, u.avatar_url, u.phone,
           COALESCE(om.organization_id, '') as organization_id
    FROM users u
    LEFT JOIN organization_members om ON u.id = om.user_id
    WHERE u.id = ?
  `);

  const user = userStmt.get(payload.userId) as (AuthenticatedUser | undefined);

  if (!user || user.status !== 'active') {
    return res.status(401).json({
      success: false,
      error: 'حساب کاربری یافت نشد یا غیرفعال شده است.',
    });
  }

  req.user = user;
  next();
}
