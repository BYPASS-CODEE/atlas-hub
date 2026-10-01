import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

export const reportRouter = Router();

reportRouter.use(authenticate);

// Dashboard Summary Counters & Recents
reportRouter.get('/dashboard-summary', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const clientsCount = (db.prepare('SELECT COUNT(*) as count FROM clients WHERE organization_id = ?').get(orgId) as any).count;
    const projectsCount = (db.prepare('SELECT COUNT(*) as count FROM projects WHERE organization_id = ?').get(orgId) as any).count;
    const tasksCount = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE organization_id = ?').get(orgId) as any).count;
    const pendingTasksCount = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE organization_id = ? AND status != 'done'").get(orgId) as any).count;
    const openTicketsCount = (db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE organization_id = ? AND status IN ('open', 'in_progress')").get(orgId) as any).count;
    const unpaidInvoicesCount = (db.prepare("SELECT COUNT(*) as count FROM invoices WHERE organization_id = ? AND status IN ('sent', 'overdue')").get(orgId) as any).count;

    // Real total revenue from paid invoices
    const revRow = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as rev FROM invoices WHERE organization_id = ? AND status = 'paid'").get(orgId) as any;
    const totalRevenue = revRow.rev;

    // Recents
    const recentProjects = db.prepare(`
      SELECT p.*, c.company_name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.organization_id = ?
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all(orgId);

    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.full_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.organization_id = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all(orgId);

    const recentTickets = db.prepare(`
      SELECT st.*, c.company_name as client_name
      FROM support_tickets st
      LEFT JOIN clients c ON st.client_id = c.id
      WHERE st.organization_id = ?
      ORDER BY st.created_at DESC
      LIMIT 5
    `).all(orgId);

    return res.json({
      success: true,
      summary: {
        clients_count: clientsCount,
        projects_count: projectsCount,
        tasks_count: tasksCount,
        pending_tasks_count: pendingTasksCount,
        open_tickets_count: openTicketsCount,
        unpaid_invoices_count: unpaidInvoicesCount,
        total_revenue: totalRevenue,
        recent_projects: recentProjects,
        recent_tasks: recentTasks,
        recent_tickets: recentTickets,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ success: false, error: 'خطا در بارگذاری خلاصه وضعیت.' });
  }
});

// Comprehensive Reports
reportRouter.get('/analytics', (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    // Invoices analytics
    const invoiceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_invoices,
        COALESCE(SUM(CASE WHEN status IN ('sent', 'overdue') THEN total_amount ELSE 0 END), 0) as outstanding_revenue
      FROM invoices
      WHERE organization_id = ?
    `).get(orgId) as any;

    // Projects stats
    const projectStats = db.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_projects,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as active_projects
      FROM projects
      WHERE organization_id = ?
    `).get(orgId) as any;

    // Tasks grouped by status
    const tasksByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tasks
      WHERE organization_id = ?
      GROUP BY status
    `).all(orgId);

    // Projects grouped by status
    const projectsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM projects
      WHERE organization_id = ?
      GROUP BY status
    `).all(orgId);

    // Revenue grouped by client
    const revenueByClient = db.prepare(`
      SELECT c.company_name as client_name, COALESCE(SUM(i.total_amount), 0) as total
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.organization_id = ? AND i.status = 'paid'
      GROUP BY c.id, c.company_name
      ORDER BY total DESC
      LIMIT 8
    `).all(orgId);

    return res.json({
      success: true,
      report: {
        total_revenue: invoiceStats.total_revenue,
        outstanding_revenue: invoiceStats.outstanding_revenue,
        total_invoices_count: invoiceStats.total_invoices,
        paid_invoices_count: invoiceStats.paid_invoices,
        total_projects_count: projectStats.total_projects,
        completed_projects_count: projectStats.completed_projects,
        active_projects_count: projectStats.active_projects,
        tasks_by_status: tasksByStatus,
        projects_by_status: projectsByStatus,
        revenue_by_client: revenueByClient,
      },
    });
  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({ success: false, error: 'خطا در تهیه گزارشات سیستم.' });
  }
});
