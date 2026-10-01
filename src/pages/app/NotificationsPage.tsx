import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../../api/miscApi.js';
import { NotificationItem } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const NotificationsPage: React.FC = () => {
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.list();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری اعلان‌ها.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('تمامی اعلان‌ها با موفقیت خوانده شدند.');
    } catch (err: any) {
      error(err.message || 'خطا در علامت‌گذاری اعلان‌ها.');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent': return <Badge variant="danger">فوری</Badge>;
      case 'warning': return <Badge variant="warning">هشدار</Badge>;
      case 'success': return <Badge variant="success">موفق</Badge>;
      default: return <Badge variant="info">اطلاعیه</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            اعلان‌ها و رویدادهای کاری
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            اطلاع‌رسانی بلادرنگ از ارجاع وظایف، پاسخ به تیکت‌ها و تغییر وضعیت پروژه‌ها
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button size="sm" variant="outline" onClick={handleMarkAll} icon={<Check className="w-4 h-4 ml-1" />}>
            علامت‌گذاری همه به عنوان خوانده‌شده
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-6 h-6" />}
            title="هیچ اعلانی در کارتابل شما نیست"
            description="به محض ارجاع وظیفه جدید، دریافت پیام در تیکت یا رویدادهای سازمانی، اعلان مربوطه در این بخش درج خواهد شد."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                  !n.is_read
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h3>
                    {getTypeBadge(n.type)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString('fa-IR')}</span>
                  </div>
                </div>

                {n.link && (
                  <div className="shrink-0">
                    <Link to={n.link} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                      <span>مشاهده جزئیات</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
