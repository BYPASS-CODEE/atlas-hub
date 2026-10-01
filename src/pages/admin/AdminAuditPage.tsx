import React, { useState, useEffect } from 'react';
import { FileText, Shield, Search, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/miscApi.js';
import { Card } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminAuditPage: React.FC = () => {
  const { error } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAuditLogs({
        page,
        limit: 50,
        action: actionFilter || undefined,
      });
      if (res.success) {
        setLogs(res.logs);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری لاگ‌های ممیزی.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadLogs(1), 250);
    return () => clearTimeout(timer);
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            گزارشات ممیزی و رویدادهای امنیتی (Audit Trail)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            بایگانی غیرقابل تغییر رویدادهای ورود، تغییرات داده‌ها و تراکنش‌های حساس کاربران
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="فیلتر رویداد (مثلاً USER_LOGIN)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-64"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadLogs(pagination.page)}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            بروزرسانی
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden font-mono text-xs">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            رویدادی با این مشخصات در بایگانی ممیزی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">عنوان رویداد (Action)</th>
                  <th className="py-3 px-4">نوع موجودیت</th>
                  <th className="py-3 px-4">کاربر مجری</th>
                  <th className="py-3 px-4">جزئیات / شناسه</th>
                  <th className="py-3 px-4">آدرس IP</th>
                  <th className="py-3 px-4 tabular-nums">زمان دقیق (UTC/محلی)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {log.user_email || log.user_name || 'سامانه عمومی'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.details || ''}>
                      {log.details || log.entity_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500 tabular-nums">
                      {log.ip_address || '::1'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                      {new Date(log.created_at).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
