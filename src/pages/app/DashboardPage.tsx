import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  LifeBuoy,
  Receipt,
  Plus,
  ArrowLeft,
  Building2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { reportsApi } from '../../api/miscApi.js';
import { DashboardSummary } from '../../types/index.js';
import { StatCard, Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useAuth } from '../../context/AuthContext.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reportsApi.getDashboardSummary();
      if (res.success && res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت خلاصه داشبورد.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'neutral';
      default: return 'neutral';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'بسیار فوری';
      case 'high': return 'اولویت بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return priority;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
      case 'paid':
        return 'success';
      case 'in_progress':
      case 'open':
        return 'info';
      case 'on_hold':
      case 'review':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      planning: 'برنامه‌ریزی',
      in_progress: 'در حال اجرا',
      review: 'بررسی نهایی',
      completed: 'تکمیل‌شده',
      on_hold: 'متوقف',
      todo: 'در صف انجام',
      done: 'انجام شد',
      open: 'در انتظار پاسخ',
      resolved: 'حل‌شده',
      closed: 'بسته‌شده',
      draft: 'پیش‌نویس',
      sent: 'ارسال‌شده',
      paid: 'تسویه‌شده',
      overdue: 'معوق',
      cancelled: 'لغوشده',
    };
    return map[status] || status;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        <Button variant="outline" size="sm" onClick={loadSummary} className="mt-4">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const s = summary!;

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            خوش آمدید، {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مرکز مدیریت و هماهنگی عملیات سازمان {user?.company_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/app/clients">
            <Button size="sm" variant="outline" icon={<Building2 className="w-3.5 h-3.5" />}>
              مشتری جدید
            </Button>
          </Link>
          <Link to="/app/projects">
            <Button size="sm" variant="outline" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              پروژه جدید
            </Button>
          </Link>
          <Link to="/app/invoices">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              صدور فاکتور
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Aggregate Stat Cards (No Fake Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مجموع درآمدهای وصول‌شده"
          value={formatCurrency(s.total_revenue)}
          subtitle={`${s.unpaid_invoices_count} فاکتور معوق/در انتظار`}
          icon={<Receipt className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="پروژه‌های در جریان"
          value={s.projects_count}
          subtitle={`ثبت شده در این سازمان`}
          icon={<FolderKanban className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          title="وظایف در انتظار انجام"
          value={s.pending_tasks_count}
          subtitle={`از کل ${s.tasks_count} تسک`}
          icon={<CheckSquare className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="تیکت‌های باز پشتیبانی"
          value={s.open_tickets_count}
          subtitle="نیازمند پاسخگویی و پیگیری"
          icon={<LifeBuoy className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* Recents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                <span>پروژه‌های اخیر</span>
              </h2>
              <Link to="/app/projects" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>مشاهده همه</span>
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3">
              {s.recent_projects.length === 0 ? (
                <EmptyState
                  title="هنوز پروژه‌ای ثبت نشده است"
                  description="جهت آغاز همکاری و رهگیری مراحل کار، اولین پروژه را برای یکی از مشتریان ایجاد نمایید."
                  actionText="ایجاد اولین پروژه"
                  onAction={() => (window.location.href = '/app/projects')}
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {s.recent_projects.map((p) => (
                    <Link
                      key={p.id}
                      to={`/app/projects/${p.id}`}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors block"
                    >
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{p.client_name || 'بدون کارفرما'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={getStatusVariant(p.status)}>
                          {getStatusLabel(p.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Pending & Urgent Tasks */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                <span>وظایف و اولویت‌های کاری</span>
              </h2>
              <Link to="/app/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>مدیریت تسک‌ها</span>
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3">
              {s.recent_tasks.length === 0 ? (
                <EmptyState
                  title="هیچ تسک فعالی وجود ندارد"
                  description="کلیه تسک‌ها تکمیل شده‌اند یا هنوز وظیفه‌ای برای پروژه‌ها تعریف نگردیده است."
                  actionText="تعریف تسک جدید"
                  onAction={() => (window.location.href = '/app/tasks')}
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {s.recent_tasks.map((t) => (
                    <Link
                      key={t.id}
                      to="/app/tasks"
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{t.project_name || 'پروژه عمومی'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={getPriorityVariant(t.priority)}>
                          {getPriorityLabel(t.priority)}
                        </Badge>
                        <Badge variant={getStatusVariant(t.status)}>
                          {getStatusLabel(t.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Support Requests */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-rose-500" />
            <span>درخواست‌های پشتیبانی اخیر (تیکتینگ)</span>
          </h2>
          <Link to="/app/support" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            <span>مشاهده همه تیکت‌ها</span>
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        <div className="mt-3">
          {s.recent_tickets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              هیچ تیکت باز یا بررسی‌نشده‌ای در سامانه وجود ندارد. وضعیت پشتیبانی کاملاً شفاف و آرام است.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {s.recent_tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/app/support/tickets/${ticket.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {ticket.ticket_number}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {ticket.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
