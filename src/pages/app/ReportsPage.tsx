import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, FolderKanban, CheckSquare, Building2, AlertCircle } from 'lucide-react';
import { reportsApi } from '../../api/miscApi.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const ReportsPage: React.FC = () => {
  const { error } = useToast();

  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const res = await reportsApi.getAnalytics();
      if (res.success && res.report) {
        setReport(res.report);
      }
    } catch (err: any) {
      error(err.message || 'خطا در استخراج گزارشات آماری.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

  const r = report;
  const hasFinancialData = r && (r.total_revenue > 0 || r.outstanding_revenue > 0 || r.total_invoices_count > 0);
  const hasTaskData = r && r.tasks_by_status && r.tasks_by_status.length > 0;
  const hasClientRevenueData = r && r.revenue_by_client && r.revenue_by_client.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          گزارشات و آمارهای تحلیلی
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          محاسبات برخط عملکرد مالی، راندمان پیشبرد پروژه‌ها و درآمد به تفکیک کارفرما (بدون داده‌های ساختگی)
        </p>
      </div>

      {/* Top Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="مجموع درآمدهای محقق‌شده (وصولی)"
          value={formatCurrency(r?.total_revenue || 0)}
          subtitle={`${r?.paid_invoices_count || 0} از ${r?.total_invoices_count || 0} فاکتور تسویه گردیده`}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="مطالبات در جریان (معوق و جاری)"
          value={formatCurrency(r?.outstanding_revenue || 0)}
          subtitle="فاکتورهای ارسال‌شده منتظر پرداخت"
          icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="نرخ موفقیت و تحویل پروژه"
          value={r?.total_projects_count ? `${Math.round(((r?.completed_projects_count || 0) / r.total_projects_count) * 100)}٪` : '0٪'}
          subtitle={`${r?.completed_projects_count || 0} پروژه تحویل قطعی از کل ${r?.total_projects_count || 0}`}
          icon={<FolderKanban className="w-5 h-5 text-indigo-500" />}
        />
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>پراکندگی وضعیت وظایف (تسک‌ها)</span>
            </h2>
          </div>

          <div className="mt-4">
            {!hasTaskData ? (
              <EmptyState
                title="داده‌ای برای تحلیل وظایف ثبت نشده است"
                description="پس از تعریف وظایف و ثبت پیشرفت کارها توسط اعضای تیم، نمودار توزیع در این بخش نمایش می‌یابد."
              />
            ) : (
              <div className="space-y-4">
                {r.tasks_by_status.map((item: any) => {
                  const statusMap: Record<string, { label: string; color: string }> = {
                    done: { label: 'تکمیل‌شده', color: 'bg-emerald-500' },
                    in_progress: { label: 'در حال انجام', color: 'bg-indigo-500' },
                    review: { label: 'در حال بررسی', color: 'bg-amber-500' },
                    todo: { label: 'در صف انجام', color: 'bg-slate-400' },
                  };
                  const meta = statusMap[item.status] || { label: item.status, color: 'bg-slate-500' };
                  const total = r.tasks_by_status.reduce((s: number, i: any) => s + i.count, 0);
                  const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;

                  return (
                    <div key={item.status} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-800 dark:text-slate-200">{meta.label}</span>
                        <span className="text-slate-400 tabular-nums">{item.count} عدد ({percent}٪)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${meta.color} rounded-full transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Revenue by Client */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>درآمد وصول‌شده به تفکیک کارفرما</span>
            </h2>
          </div>

          <div className="mt-4">
            {!hasClientRevenueData ? (
              <EmptyState
                title="هنوز درآمدی از مشتریان تسویه نشده است"
                description="به محض تسویه فاکتورهای صادره، رتبه‌بندی و سهم مالی هر مشتری در این قسمت درج می‌شود."
              />
            ) : (
              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
                {r.revenue_by_client.map((c: any, idx: number) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="text-slate-400 tabular-nums">{idx + 1}.</span>
                      <span>{c.client_name}</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(c.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
