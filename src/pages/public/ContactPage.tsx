import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Button } from '../../components/ui/Button.js';
import { contactApi } from '../../api/miscApi.js';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMsg('لطفاً تمامی فیلدهای فرم تماس را تکمیل نمایید.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await contactApi.send(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'پیام شما با موفقیت در سیستم ثبت گردید.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          ارتباط با تیم اطلس هاب
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          برای طرح پرسش‌ها، مشاوره پیاده‌سازی یا پیشنهادات همکاری، فرم زیر را ارسال فرمایید. پیام شما مستقیماً در پایگاه داده پشتیبانی ثبت و بررسی می‌شود.
        </p>
      </div>

      <Card className="max-w-xl mx-auto p-6 sm:p-8">
        {successMsg ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">پیام شما دریافت شد</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{successMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuccessMsg(null)}
              className="mt-4"
            >
              ارسال پیام جدید
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Input
              label="نام و نام خانوادگی"
              required
              placeholder="مثال: علی احمدی"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="آدرس ایمیل"
              type="email"
              required
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="موضوع پیام"
              required
              placeholder="درخواست راهنمایی در پیکربندی سازمانی"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />

            <Textarea
              label="متن پیام"
              required
              rows={4}
              placeholder="جزئیات درخواست یا پیام خود را به طور کامل بنویسید..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<Send className="w-4 h-4 ml-1" />}
              >
                ارسال پیام
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
