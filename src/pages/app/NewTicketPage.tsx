import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LifeBuoy, ArrowRight, Send, AlertCircle } from 'lucide-react';
import { ticketsApi } from '../../api/ticketsApi.js';
import { clientsApi } from '../../api/clientsApi.js';
import { Client } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { useToast } from '../../context/ToastContext.js';

export const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    client_id: '',
    description: '',
  });

  useEffect(() => {
    clientsApi.list().then((res) => {
      if (res.success) setClients(res.clients);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      error('موضوع و شرح درخواست تیکت الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ticketsApi.create({
        subject: form.subject,
        description: form.description,
        category: form.category,
        priority: form.priority,
        client_id: form.client_id || undefined,
      });

      if (res.success) {
        success(`تیکت جدید با شماره پیگیری ${res.ticket_number} ثبت گردید.`);
        navigate(`/app/support/tickets/${res.id}`);
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت تیکت پشتیبانی.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link to="/app/support" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به مرکز پشتیبانی</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          ثبت تیکت و درخواست پشتیبانی
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          درخواست شما با شماره پیگیری یکتا ثبت و در کارتابل کارشناسان قرار خواهد گرفت
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="موضوع درخواست"
            required
            placeholder="مثال: بروز خطا در زمان تست نهایی ماژول پرداخت"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="دسته‌بندی درخواست"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: 'technical', label: 'پشتیبانی فنی و باگ' },
                { value: 'billing', label: 'امور مالی و حسابداری' },
                { value: 'feature', label: 'درخواست امکانات جدید' },
                { value: 'general', label: 'پرسش عمومی یا اداری' },
              ]}
            />

            <Select
              label="سطح اولویت"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={[
                { value: 'low', label: 'عادی / کم‌اهمیت' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'فوری' },
                { value: 'urgent', label: 'بحرانی و توقف کار' },
              ]}
            />

            <Select
              label="مشتری مرتبط (اختیاری)"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              <option value="">عمومی / کل سازمان</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="شرح کامل درخواست"
            required
            rows={6}
            placeholder="لطفاً جزئیات دقیق مسئله، مراحل بازتولید مشکل یا شرایط مدنظرتان را توضیح دهید..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/app/support">
              <Button type="button" variant="outline">
                انصراف
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} icon={<Send className="w-4 h-4 ml-1" />}>
              ثبت و ارسال تیکت
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
