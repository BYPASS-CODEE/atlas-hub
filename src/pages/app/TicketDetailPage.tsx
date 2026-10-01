import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, User } from 'lucide-react';
import { ticketsApi } from '../../api/ticketsApi.js';
import { SupportTicket, TicketMessage } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<(SupportTicket & { messages: TicketMessage[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const loadTicket = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await ticketsApi.getById(id);
      if (res.success && res.ticket) {
        setTicket(res.ticket);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری تیکت.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsSubmittingReply(true);
      const res = await ticketsApi.addMessage(id!, replyText.trim());
      if (res.success && res.reply) {
        setTicket((prev) =>
          prev ? { ...prev, messages: [...(prev.messages || []), res.reply] } : null
        );
        setReplyText('');
        success('پاسخ شما با موفقیت ارسال شد.');
      }
    } catch (err: any) {
      error(err.message || 'خطا در ارسال پاسخ.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await ticketsApi.updateStatus(id!, newStatus);
      if (res.success) {
        setTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        success('وضعیت تیکت تغییر یافت.');
      }
    } catch (err: any) {
      error(err.message || 'خطا در تغییر وضعیت تیکت.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">تیکت مورد نظر یافت نشد یا دسترسی نامعتبر است.</p>
        <Link to="/app/support">
          <Button variant="outline" size="sm">
            بازگشت به پشتیبانی
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back and Title */}
      <div>
        <Link to="/app/support" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به فهرست تیکت‌ها</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {ticket.ticket_number}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {ticket.subject}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              ارسال‌شده توسط: {ticket.user_name} ({ticket.user_email || 'کاربر'})
            </p>
          </div>

          {/* Quick status selector */}
          <div className="w-44 shrink-0">
            <Select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: 'open', label: 'در انتظار پاسخ' },
                { value: 'in_progress', label: 'در حال بررسی' },
                { value: 'resolved', label: 'حل‌شده' },
                { value: 'closed', label: 'بسته‌شده' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Ticket Info Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span>دسته: {ticket.category}</span>
          <span>·</span>
          <span>اولویت: {ticket.priority}</span>
          <span>·</span>
          <span className="tabular-nums">ثبت: {new Date(ticket.created_at).toLocaleString('fa-IR')}</span>
        </div>

        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {ticket.description}
        </div>
      </Card>

      {/* Threaded Message Conversation */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          تاریخچه مکاتبات ({ticket.messages?.length || 0})
        </h2>

        {ticket.messages && ticket.messages.length > 0 ? (
          <div className="space-y-4">
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  m.is_staff_reply
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60'
                    : 'theme-card border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{m.user_name}</span>
                    {m.is_staff_reply ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-medium">
                        کارشناس پشتیبانی
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        کارفرما
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 tabular-nums">
                    {new Date(m.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>

                <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line">
                  {m.message}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            هنوز پاسخی برای این تیکت ثبت نشده است. پاسخ اولیه خود را در کادر زیر بنویسید.
          </div>
        )}

        {/* Reply Box */}
        {ticket.status !== 'closed' ? (
          <Card className="p-4 sm:p-5">
            <form onSubmit={handleSendReply} className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                ارسال پاسخ جدید
              </label>
              <Textarea
                rows={4}
                required
                placeholder="متن پاسخ خود را به طور شفاف و مستند مرقوم فرمایید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  پس از ارسال، اعلان فوری به کارفرما ارسال خواهد شد.
                </span>
                <Button type="submit" isLoading={isSubmittingReply} icon={<Send className="w-4 h-4 ml-1" />}>
                  ارسال پاسخ
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
            این تیکت بسته‌شده است. برای ادامه گفتگو وضعیت را به «در حال پیگیری» تغییر دهید.
          </div>
        )}
      </div>
    </div>
  );
};
