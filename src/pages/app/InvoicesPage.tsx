import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Plus, Search, Calendar, DollarSign, Building2, Trash2, Edit2, ExternalLink, Printer } from 'lucide-react';
import { invoicesApi } from '../../api/invoicesApi.js';
import { clientsApi } from '../../api/clientsApi.js';
import { projectsApi } from '../../api/projectsApi.js';
import { Invoice, Client, Project, InvoiceItem } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const InvoicesPage: React.FC = () => {
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    tax_rate: 10,
    currency: 'تومان',
    notes: '',
    items: [
      { description: 'توسعه نرم‌افزار و پیاده‌سازی فاز اول', quantity: 1, unit_price: 15000000 },
    ],
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invRes, clientRes, projRes] = await Promise.all([
        invoicesApi.list({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          client_id: clientFilter !== 'all' ? clientFilter : undefined,
        }),
        clientsApi.list(),
        projectsApi.list(),
      ]);

      if (invRes.success) setInvoices(invRes.invoices);
      if (clientRes.success) setClients(clientRes.clients);
      if (projRes.success) setProjects(projRes.projects);
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری فاکتورها.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, clientFilter]);

  const handleOpenCreate = () => {
    if (clients.length === 0) {
      error('جهت صدور فاکتور، ابتدا باید حداقل یک مشتری در سیستم ثبت کرده باشید.');
      return;
    }

    setForm({
      client_id: clients[0]?.id || '',
      project_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      tax_rate: 10,
      currency: 'تومان',
      notes: 'مهلت پرداخت حداکثر تا تاریخ سررسید مندرج در صورتحساب می‌باشد.',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      error('انتخاب مشتری الزامی است.');
      return;
    }

    for (const item of form.items) {
      if (!item.description.trim()) {
        error('شرح تمامی ردیف‌های فاکتور باید تکمیل شود.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await invoicesApi.create({
        client_id: form.client_id,
        project_id: form.project_id || undefined,
        issue_date: form.issue_date,
        due_date: form.due_date,
        tax_rate: Number(form.tax_rate),
        currency: form.currency,
        notes: form.notes,
        items: form.items,
      });

      if (res.success) {
        success(`فاکتور جدید با شماره ${res.invoice_number} صادر گردید.`);
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت فاکتور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!window.confirm(`آیا از حذف فاکتور پیش‌نویس "${inv.invoice_number}" مطمئن هستید؟`)) return;
    try {
      const res = await invoicesApi.delete(inv.id);
      if (res.success) {
        success('فاکتور با موفقیت حذف شد.');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'خطا در حذف فاکتور.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">تسویه‌شده</Badge>;
      case 'sent': return <Badge variant="info">ارسال‌شده</Badge>;
      case 'overdue': return <Badge variant="danger">معوق / سررسیدگذشته</Badge>;
      case 'cancelled': return <Badge variant="neutral">لغوشده</Badge>;
      default: return <Badge variant="warning">پیش‌نویس</Badge>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  // Live total preview in create form
  const subtotalPreview = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0), 0);
  const taxPreview = (subtotalPreview * (Number(form.tax_rate) || 0)) / 100;
  const totalPreview = subtotalPreview + taxPreview;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            فاکتورها و امور مالی
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            صدور فاکتورهای رسمی، محاسبه خودکار مالیات و ثبت دریافتی‌ها
          </p>
        </div>

        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4 ml-1" />}>
          صدور فاکتور جدید
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="جستجو بر اساس شماره فاکتور یا نام کارفرما..."
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
              { value: 'draft', label: 'پیش‌نویس' },
              { value: 'sent', label: 'ارسال‌شده' },
              { value: 'paid', label: 'تسویه‌شده' },
              { value: 'overdue', label: 'معوق' },
              { value: 'cancelled', label: 'لغوشده' },
            ]}
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">تمامی مشتریان</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="هیچ فاکتوری یافت نشد"
            description="جهت صدور اولین فاکتور رسمی برای مشتریان، از دکمه زیر استفاده نمایید."
            actionText="صدور اولین فاکتور"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">شماره فاکتور</th>
                  <th className="py-3.5 px-4">مشتری و پروژه</th>
                  <th className="py-3.5 px-4">تاریخ صدور / سررسید</th>
                  <th className="py-3.5 px-4 tabular-nums">مبلغ کل</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <Link to={`/app/invoices/${inv.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
                        <span>{inv.invoice_number}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{inv.client_name}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{inv.project_name || 'بدون اتصال به پروژه'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div>صدور: {new Date(inv.issue_date).toLocaleDateString('fa-IR')}</div>
                      <div className="text-slate-400">سررسید: {new Date(inv.due_date).toLocaleDateString('fa-IR')}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/app/invoices/${inv.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="مشاهده فاکتور"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(inv)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="حذف پیش‌نویس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="صدور فاکتور رسمی جدید"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="مشتری طرف حساب"
              required
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.contact_name})
                </option>
              ))}
            </Select>

            <Select
              label="پروژه مرتبط (اختیاری)"
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">خدمات عمومی / مستقل از پروژه</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="تاریخ صدور"
              type="date"
              required
              value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            />
            <Input
              label="سررسید پرداخت"
              type="date"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
            <Input
              label="نرخ مالیات بر ارزش افزوده (٪)"
              type="number"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
            />
          </div>

          {/* Line items section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                اقلام و ردیف‌های صورتحساب
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={handleAddItem} icon={<Plus className="w-3.5 h-3.5" />}>
                افزودن ردیف
              </Button>
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-end gap-2 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex-1 w-full">
                  <Input
                    label={idx === 0 ? 'شرح خدمات یا کالا' : undefined}
                    placeholder="مثال: طراحی رابط کاربری و صفحات فرود"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input
                    label={idx === 0 ? 'تعداد' : undefined}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <Input
                    label={idx === 0 ? 'مبلغ واحد (تومان)' : undefined}
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 transition-colors"
                    title="حذف این ردیف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Real Live Calculation Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 tabular-nums">
              <span>جمع اقلام (Subtotal):</span>
              <span>{formatCurrency(subtotalPreview)}</span>
            </div>
            <div className="flex justify-between text-slate-500 tabular-nums">
              <span>مالیات بر ارزش افزوده ({form.tax_rate}٪):</span>
              <span>{formatCurrency(taxPreview)}</span>
            </div>
            <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-700 tabular-nums">
              <span>مبلغ نهایی فاکتور:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(totalPreview)}</span>
            </div>
          </div>

          <Textarea
            label="توضیحات و شرایط پرداخت (اختیاری)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              صدور و ثبت فاکتور
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
