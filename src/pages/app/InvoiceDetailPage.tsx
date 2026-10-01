import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Printer, CheckCircle2, DollarSign, Building2, Calendar, FileText, Plus, AlertCircle } from 'lucide-react';
import { invoicesApi } from '../../api/invoicesApi.js';
import { Invoice } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'کارت به کارت / حواله بانکی',
    payment_date: new Date().toISOString().split('T')[0],
    reference_id: '',
    notes: '',
  });

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await invoicesApi.getById(id);
      if (res.success && res.invoice) {
        setInvoice(res.invoice);
        setPaymentForm((prev) => ({
          ...prev,
          amount: (res.invoice.total_amount - (res.invoice.payments?.reduce((s, p) => s + p.amount, 0) || 0)).toString(),
        }));
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری فاکتور.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      error('مبلغ پرداختی باید معتبر و بزرگتر از صفر باشد.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await invoicesApi.addPayment(id!, {
        amount: amountNum,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        reference_id: paymentForm.reference_id || undefined,
        notes: paymentForm.notes || undefined,
      });

      if (res.success) {
        success('پرداخت با موفقیت در سیستم ثبت گردید.');
        setIsPaymentModalOpen(false);
        loadInvoice();
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت پرداخت.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const res = await invoicesApi.updateStatus(id!, status);
      if (res.success) {
        setInvoice((prev) => (prev ? { ...prev, status: status as any } : null));
        success('وضعیت فاکتور تغییر یافت.');
      }
    } catch (err: any) {
      error(err.message || 'خطا در تغییر وضعیت.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm font-semibold text-slate-600">فاکتور مورد نظر یافت نشد.</p>
        <Link to="/app/invoices">
          <Button variant="outline" size="sm">
            بازگشت به فهرست فاکتورها
          </Button>
        </Link>
      </div>
    );
  }

  const payments = invoice.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, invoice.total_amount - totalPaid);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link to="/app/invoices" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به فهرست فاکتورها</span>
        </Link>

        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <Button size="sm" onClick={() => setIsPaymentModalOpen(true)} icon={<DollarSign className="w-3.5 h-3.5" />}>
              ثبت پرداخت جدید
            </Button>
          )}

          <div className="w-36">
            <Select
              value={invoice.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: 'draft', label: 'پیش‌نویس' },
                { value: 'sent', label: 'ارسال‌شده' },
                { value: 'paid', label: 'تسویه‌شده' },
                { value: 'overdue', label: 'معوق' },
                { value: 'cancelled', label: 'لغوشده' },
              ]}
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            چاپ / PDF
          </Button>
        </div>
      </div>

      {/* Printable Formal Invoice Card */}
      <Card className="p-8 sm:p-12 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm print:bg-white print:text-slate-900 print:border-none print:shadow-none">
        {/* Invoice Top Lockup */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 print:text-slate-900">
                {user?.company_name || 'ATLAS HUB'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500 mt-1">صورتحساب رسمی خدمات و کالا</p>
          </div>

          <div className="text-left space-y-1">
            <h2 className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">{invoice.invoice_number}</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500 tabular-nums space-y-0.5">
              <p>تاریخ صدور: {new Date(invoice.issue_date).toLocaleDateString('fa-IR')}</p>
              <p>سررسید پرداخت: {new Date(invoice.due_date).toLocaleDateString('fa-IR')}</p>
            </div>
            <div className="pt-1">
              <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'neutral'}>
                {invoice.status === 'paid' ? 'تسویه‌شده' : invoice.status === 'sent' ? 'ارسال‌شده به کارفرما' : invoice.status === 'draft' ? 'پیش‌نویس' : invoice.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Seller and Buyer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 print:bg-slate-50 print:border-slate-100">
            <span className="font-semibold text-slate-400 block uppercase tracking-wider">مشخصات صادرکننده:</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">{user?.company_name || 'سازمان صادرکننده'}</p>
            <p className="text-slate-600 dark:text-slate-300 print:text-slate-600">پست الکترونیکی: {user?.email}</p>
            {user?.phone && <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-mono">تلفن: {user.phone}</p>}
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 print:bg-slate-50 print:border-slate-100">
            <span className="font-semibold text-slate-400 block uppercase tracking-wider">مشخصات خریدار / کارفرما:</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">{invoice.client_name}</p>
            {invoice.client_contact && <p className="text-slate-600 dark:text-slate-300 print:text-slate-600">نماینده: {invoice.client_contact}</p>}
            {invoice.client_email && <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-mono">ایمیل: {invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-mono">تلفن: {invoice.client_phone}</p>}
            {invoice.client_address && <p className="text-slate-600 dark:text-slate-300 print:text-slate-600">نشانی: {invoice.client_address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/70 border-y border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 print:bg-slate-100 print:border-slate-200 print:text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">ردیف</th>
                <th className="py-2.5 px-3">شرح خدمات یا کالا</th>
                <th className="py-2.5 px-3 tabular-nums text-center">تعداد / مقدار</th>
                <th className="py-2.5 px-3 tabular-nums">مبلغ واحد (تومان)</th>
                <th className="py-2.5 px-3 tabular-nums text-left">مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-100">
              {invoice.items && invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 tabular-nums text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">{item.description}</td>
                  <td className="py-3 px-3 tabular-nums text-center text-slate-600 dark:text-slate-400 print:text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-slate-400 print:text-slate-600">{new Intl.NumberFormat('fa-IR').format(item.unit_price)}</td>
                  <td className="py-3 px-3 tabular-nums font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 text-left">
                    {new Intl.NumberFormat('fa-IR').format(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 print:border-slate-200 text-xs">
          <div className="max-w-xs space-y-2">
            {invoice.notes && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 print:bg-slate-50 print:border-slate-100 text-slate-600 dark:text-slate-300 print:text-slate-600">
                <span className="font-semibold block mb-0.5 text-slate-800 dark:text-slate-200 print:text-slate-800">شرایط و توضیحات:</span>
                {invoice.notes}
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600 tabular-nums">
              <span>جمع اقلام:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600 tabular-nums">
              <span>مالیات بر ارزش افزوده ({invoice.tax_rate}٪):</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 pt-2 border-t border-slate-200 dark:border-slate-800 print:border-slate-200 tabular-nums">
              <span>مبلغ نهایی فاکتور:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{formatCurrency(invoice.total_amount)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 tabular-nums pt-1">
                  <span>مجموع مبالغ پرداخت‌شده:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 tabular-nums">
                  <span>مانده قابل پرداخت:</span>
                  <span>{formatCurrency(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        {payments.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 print:border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 print:text-slate-700 uppercase tracking-wider">
              سوابق پرداخت‌های ثبت‌شده
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-100 rounded-lg border border-slate-100 dark:border-slate-800 print:border-slate-100 overflow-hidden text-xs">
              {payments.map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 print:bg-slate-50/50">
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 print:text-slate-900 block">{p.payment_method}</span>
                    <span className="text-[11px] text-slate-400 block tabular-nums">
                      تاریخ: {new Date(p.payment_date).toLocaleDateString('fa-IR')}
                      {p.reference_id && ` · پیگیری: ${p.reference_id}`}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="ثبت دریافت وجه / پرداخت فاکتور"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="مبلغ پرداختی (تومان)"
            type="number"
            required
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />

          <Select
            label="روش پرداخت"
            value={paymentForm.payment_method}
            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
            options={[
              { value: 'کارت به کارت / حواله بانکی', label: 'کارت به کارت / حواله بانکی' },
              { value: 'ساتنا / پایا', label: 'انتقال ساتنا / پایا' },
              { value: 'چک صیادی', label: 'چک صیادی بانکی' },
              { value: 'درگاه پرداخت اینترنتی', label: 'درگاه پرداخت اینترنتی' },
              { value: 'نقدی', label: 'وجه نقد' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="تاریخ پرداخت"
              type="date"
              required
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
            />

            <Input
              label="شماره پیگیری / ارجاع بانکی"
              placeholder="مثال: 98452174"
              value={paymentForm.reference_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_id: e.target.value })}
            />
          </div>

          <Input
            label="توضیحات و بابت (اختیاری)"
            placeholder="مثال: واریز پیش‌پرداخت ۵۰ درصدی قرارداد"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmittingPayment}>
              ثبت پرداخت
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
