import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'دسترسی غیرمجاز. ابتدا وارد سیستم شوید.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'شما سطح دسترسی لازم برای انجام این عملیات را ندارید.',
      });
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'دسترسی به این بخش صرفاً برای مدیران ارشد سیستم مجاز است.',
    });
  }
  next();
}
