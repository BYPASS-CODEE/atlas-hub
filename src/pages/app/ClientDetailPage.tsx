import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, ArrowRight, FolderKanban, Receipt, Plus, Clock, ExternalLink } from 'lucide-react';
import { clientsApi } from '../../api/clientsApi.js';
import { Client } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { useToast } from '../../context/ToastContext.js';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { error } = useToast();

  const [client, setClient] = useState<(Client & { projects: any[]; invoices: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadClient = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await clientsApi.getById(id);
      if (res.success && res.client) {
        setClient(res.client);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری پرونده مشتری.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">مشتری مورد نظر یافت نشد.</p>
        <Link to="/app/clients">
          <Button variant="outline" size="sm">
            بازگشت به فهرست مشتریان
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Back navigation */}
      <div>
        <Link to="/app/clients" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به فهرست مشتریان</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {client.company_name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">نماینده طرف حساب: {client.contact_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/app/projects?client_id=${client.id}`}>
              <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}>
                تعریف پروژه جدید
              </Button>
            </Link>
            <Link to={`/app/invoices`}>
              <Button size="sm" icon={<Receipt className="w-3.5 h-3.5" />}>
                صدور فاکتور
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Client Overview Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">پست الکترونیکی</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono mt-1 block select-all">{client.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">تلفن تماس</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono mt-1 block select-all">{client.phone || 'ثبت نشده'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">وضعیت همکاری</span>
            <span className="mt-1 block">
              <Badge variant={client.status === 'active' ? 'success' : 'neutral'}>
                {client.status === 'active' ? 'فعال' : client.status === 'lead' ? 'سرنخ' : 'راکد'}
              </Badge>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">تاریخ عضویت و ثبت</span>
            <span className="text-slate-800 dark:text-slate-200 tabular-nums mt-1 block">
              {new Date(client.created_at).toLocaleDateString('fa-IR')}
            </span>
          </div>
        </div>

        {client.address && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{client.address}</span>
          </div>
        )}

        {client.notes && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block mb-1">یادداشت‌های داخلی:</span>
            {client.notes}
          </div>
        )}
      </Card>

      {/* Two columns: Associated Projects & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>پروژه‌های این مشتری ({client.projects?.length || 0})</span>
            </h2>
          </div>

          <div className="mt-4">
            {!client.projects || client.projects.length === 0 ? (
              <EmptyState
                title="پروژه‌ای برای این مشتری تعریف نشده است"
                description="می‌توانید اولین پروژه را جهت زمان‌بندی و برنامه‌ریزی امور تعریف نمایید."
                actionText="ایجاد اولین پروژه"
                onAction={() => (window.location.href = `/app/projects?client_id=${client.id}`)}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {client.projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/app/projects/${p.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">بودجه: {formatCurrency(p.budget || 0)}</p>
                    </div>
                    <Badge variant={p.status === 'completed' ? 'success' : 'info'}>
                      {p.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Invoices */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>صورتحساب‌ها و فاکتورها ({client.invoices?.length || 0})</span>
            </h2>
          </div>

          <div className="mt-4">
            {!client.invoices || client.invoices.length === 0 ? (
              <EmptyState
                title="فاکتوری برای این مشتری صادر نشده است"
                description="صدور فاکتور رسمی با قابلیت محاسبه اقلام، مالیات و ثبت پرداخت‌های مالی."
                actionText="صدور فاکتور جدید"
                onAction={() => (window.location.href = `/app/invoices`)}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {client.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/app/invoices/${inv.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        سررسید: {new Date(inv.due_date).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(inv.total_amount)}
                      </p>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{inv.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
