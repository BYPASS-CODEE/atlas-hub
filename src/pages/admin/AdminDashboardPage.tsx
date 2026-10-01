import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Building, FolderKanban, Receipt, FileText, Cpu, HardDrive, Clock, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/miscApi.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminDashboardPage: React.FC = () => {
  const { error } = useToast();

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری اطلاعات نظارتی سیستم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats;
  const recentLogs = data?.recent_audit_logs || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>نظارت مرکزی و سلامت زیرساخت</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          خلاصه تجمیعی سرور، پایگاه داده رابطه‌ای و رویدادهای ممیزی امنیتی
        </p>
      </div>

      {/* System Runtime Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">محیط و نگارش Node.js</span>
            <p className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats?.node_version || 'Node.js'}</p>
          </div>
          <Cpu className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">حافظه مصرفی پروسس (Heap)</span>
            <p className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              {stats?.memory_usage_mb || 0} مگابایت
            </p>
          </div>
          <HardDrive className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">زمان فعالیت پیوسته (Uptime)</span>
            <p className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 tabular-nums">
              {Math.floor((stats?.uptime_seconds || 0) / 60)} دقیقه
            </p>
          </div>
          <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </Card>
      </div>

      {/* Platform-Wide Real DB Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>کل کاربران سامانه</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900 dark:text-slate-100">{stats?.total_users || 0}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>سازمان‌های ثبت‌شده</span>
            <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900 dark:text-slate-100">{stats?.total_organizations || 0}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>پروژه‌ها و جریان‌ها</span>
            <FolderKanban className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900 dark:text-slate-100">{stats?.total_projects || 0}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>مجموع فاکتورهای صادره</span>
            <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900 dark:text-slate-100">{stats?.total_invoices || 0}</p>
        </Card>
      </div>

      {/* Recent Audit Stream */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-amber-500" />
          <span>جریان زنده لاگ‌های ممیزی امنیتی (Audit Logs Stream)</span>
        </h2>

        <div className="mt-4">
          {recentLogs.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
              هنوز لاگ ممیزی جدیدی ثبت نشده است.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{log.action}</span>
                    <span className="text-slate-500 dark:text-slate-400">({log.entity_type})</span>
                    {log.user_email && <span className="text-slate-700 dark:text-slate-300">توسط {log.user_email}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px] tabular-nums">
                    <span>IP: {log.ip_address || 'internal'}</span>
                    <span>{new Date(log.created_at).toLocaleString('fa-IR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
