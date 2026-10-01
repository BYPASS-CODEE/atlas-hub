import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, Mail, Phone, ExternalLink, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { clientsApi } from '../../api/clientsApi.js';
import { Client } from '../../types/index.js';
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

export const ClientsPage: React.FC = () => {
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    notes: '',
  });

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const res = await clientsApi.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (res.success) {
        setClients(res.clients);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری مشتریان.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadClients, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setForm({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setForm({
      company_name: c.company_name,
      contact_name: c.contact_name,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
      status: c.status,
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      error('نام شرکت، نام نماینده و ایمیل الزامی هستند.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClient) {
        const res = await clientsApi.update(editingClient.id, {
          ...form,
          status: form.status as any,
        });
        if (res.success) {
          success('اطلاعات مشتری بروزرسانی گردید.');
          setIsModalOpen(false);
          loadClients();
        }
      } else {
        const res = await clientsApi.create(form);
        if (res.success) {
          success('مشتری جدید با موفقیت ثبت شد.');
          setIsModalOpen(false);
          loadClients();
        }
      }
    } catch (err: any) {
      error(err.message || 'خطا در ذخیره اطلاعات مشتری.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: Client) => {
    if (!window.confirm(`آیا از حذف مشتری "${c.company_name}" اطمینان دارید؟`)) return;
    try {
      const res = await clientsApi.delete(c.id);
      if (res.success) {
        success('مشتری با موفقیت حذف گردید.');
        loadClients();
      }
    } catch (err: any) {
      error(err.message || 'امکان حذف مشتری وجود ندارد.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">فعال</Badge>;
      case 'lead':
        return <Badge variant="info">سرنخ / در مذاکره</Badge>;
      case 'inactive':
        return <Badge variant="neutral">غیرفعال / راکد</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            مدیریت مشتریان و کارفرمایان
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            بانک متمرکز شرکت‌ها، طرف‌های قرارداد و سرنخ‌های تجاری
          </p>
        </div>

        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4 ml-1" />}>
          افزودن مشتری جدید
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="جستجو بر اساس نام شرکت، نماینده، ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'تمامی وضعیت‌ها' },
              { value: 'active', label: 'فقط فعال' },
              { value: 'lead', label: 'سرنخ‌های کاری' },
              { value: 'inactive', label: 'غیرفعال' },
            ]}
          />
        </div>
      </Card>

      {/* Clients Table / List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title="هیچ مشتری مطابق با جستجو یافت نشد"
            description="برای شروع ثبت تعاملات و صدور فاکتور، اولین مشتری سازمان خود را ایجاد نمایید."
            actionText="ایجاد مشتری جدید"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">شرکت و نماینده</th>
                  <th className="py-3.5 px-4">ارتباطات</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 tabular-nums">پروژه‌ها / فاکتورها</th>
                  <th className="py-3.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link to={`/app/clients/${c.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
                        <span>{c.company_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <span className="text-xs text-slate-400 block mt-0.5">نماینده: {c.contact_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      <span>{c.projects_count || 0} پروژه</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>{c.invoices_count || 0} فاکتور</span>
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="ویرایش اطلاعات"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="حذف مشتری"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'ویرایش مشخصات مشتری' : 'ثبت مشتری یا کارفرمای جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="نام شرکت یا کسب‌وکار"
            required
            placeholder="مثال: شرکت داده‌ورزان نوین"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />

          <Input
            label="نام و نام خانوادگی نماینده / مخاطب"
            required
            placeholder="مثال: مهندس رضوانی"
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="آدرس ایمیل"
              type="email"
              required
              placeholder="contact@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="شماره تماس"
              type="tel"
              placeholder="02188888888"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Select
            label="وضعیت همکاری"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'active', label: 'فعال (دارای قرارداد جاری)' },
              { value: 'lead', label: 'سرنخ تجاری (در حال مذاکره)' },
              { value: 'inactive', label: 'راکد / خاتمه همکاری' },
            ]}
          />

          <Input
            label="آدرس پستی یا موقعیت"
            placeholder="تهران، خیابان ولیعصر..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <Textarea
            label="یادداشت‌های داخلی (اختیاری)"
            rows={3}
            placeholder="نکات هماهنگی، توافقات اولیه یا شرایط پرداخت ویژه..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingClient ? 'ذخیره تغییرات' : 'ثبت مشتری'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
