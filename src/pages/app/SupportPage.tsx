import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Plus, Search, Clock, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';
import { ticketsApi } from '../../api/ticketsApi.js';
import { SupportTicket } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const SupportPage: React.FC = () => {
  const { error } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const res = await ticketsApi.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      if (res.success) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری تیکت‌ها.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadTickets, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, categoryFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="danger">در انتظار پاسخ</Badge>;
      case 'in_progress':
        return <Badge variant="info">در حال پیگیری</Badge>;
      case 'resolved':
        return <Badge variant="success">حل‌شده</Badge>;
      case 'closed':
        return <Badge variant="neutral">بسته‌شده</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'پشتیبانی فنی';
      case 'billing': return 'امور مالی و فاکتور';
      case 'feature': return 'درخواست قابلیت جدید';
      case 'general': return 'عمومی و اداری';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            مرکز پشتیبانی و تیکتینگ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            پیگیری مکاتبات رسمی، رفع مشکلات فنی و استعلامات کارفرمایان
          </p>
        </div>

        <Link to="/app/support/new">
          <Button icon={<Plus className="w-4 h-4 ml-1" />}>
            ثبت تیکت جدید
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="جستجو بر اساس شماره تیکت، موضوع یا شرح درخواست..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'تمامی وضعیت‌ها' },
              { value: 'open', label: 'در انتظار پاسخ' },
              { value: 'in_progress', label: 'در حال بررسی' },
              { value: 'resolved', label: 'حل‌شده' },
              { value: 'closed', label: 'بسته‌شده' },
            ]}
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'تمامی دسته‌ها' },
              { value: 'technical', label: 'فنی' },
              { value: 'billing', label: 'مالی' },
              { value: 'feature', label: 'امکانات' },
              { value: 'general', label: 'عمومی' },
            ]}
          />
        </div>
      </Card>

      {/* Tickets List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="w-6 h-6" />}
            title="هیچ تیکت پشتیبانی با این مشخصات یافت نشد"
            description="در صورت بروز هرگونه ابهام یا نیاز به پشتیبانی فنی، می‌توانید تیکت جدید ارسال نمایید."
            actionText="ثبت اولین تیکت"
            onAction={() => (window.location.href = '/app/support/new')}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/app/support/tickets/${t.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors block"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded shrink-0">
                    {t.ticket_number}
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                      {t.subject}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>دسته: {getCategoryLabel(t.category)}</span>
                      <span>·</span>
                      <span>ایجادکننده: {t.user_name || 'کاربر'}</span>
                      {t.client_name && (
                        <>
                          <span>·</span>
                          <span>مشتری: {t.client_name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {new Date(t.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="tabular-nums">{t.messages_count || 0} پیام</span>
                  </div>

                  {getStatusBadge(t.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
