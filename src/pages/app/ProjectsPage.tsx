import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Search, Calendar, DollarSign, Building2, CheckCircle2, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { projectsApi } from '../../api/projectsApi.js';
import { clientsApi } from '../../api/clientsApi.js';
import { Project, Client } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const ProjectsPage: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const clientFilterParam = searchParams.get('client_id');

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState(clientFilterParam || 'all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [form, setForm] = useState({
    name: '',
    client_id: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    budget: '',
    deadline: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projRes, clientRes] = await Promise.all([
        projectsApi.list({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          client_id: clientFilter !== 'all' ? clientFilter : undefined,
        }),
        clientsApi.list(),
      ]);

      if (projRes.success) setProjects(projRes.projects);
      if (clientRes.success) setClients(clientRes.clients);
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری اطلاعات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, clientFilter]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setForm({
      name: '',
      client_id: clientFilterParam || '',
      description: '',
      status: 'planning',
      priority: 'medium',
      budget: '',
      deadline: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setForm({
      name: p.name,
      client_id: p.client_id || '',
      description: p.description || '',
      status: p.status,
      priority: p.priority,
      budget: p.budget ? p.budget.toString() : '',
      deadline: p.deadline || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      error('نام پروژه الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingProject) {
        const res = await projectsApi.update(editingProject.id, {
          name: form.name,
          client_id: form.client_id || undefined,
          description: form.description,
          status: form.status as any,
          priority: form.priority as any,
          budget: parseFloat(form.budget) || 0,
          deadline: form.deadline || undefined,
        });
        if (res.success) {
          success('پروژه با موفقیت ویرایش شد.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await projectsApi.create({
          name: form.name,
          client_id: form.client_id || undefined,
          description: form.description,
          status: form.status,
          priority: form.priority,
          budget: parseFloat(form.budget) || 0,
          deadline: form.deadline || undefined,
        });
        if (res.success) {
          success('پروژه جدید با موفقیت ایجاد گردید.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت پروژه.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (p: Project) => {
    if (!window.confirm(`آیا از حذف کامل پروژه "${p.name}" اطمینان دارید؟ کلیه وظایف مرتبط نیز حذف خواهند شد.`)) return;
    try {
      const res = await projectsApi.delete(p.id);
      if (res.success) {
        success('پروژه حذف شد.');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'خطا در حذف پروژه.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">تکمیل‌شده</Badge>;
      case 'in_progress': return <Badge variant="info">در حال اجرا</Badge>;
      case 'review': return <Badge variant="warning">در حال بررسی</Badge>;
      case 'on_hold': return <Badge variant="danger">متوقف</Badge>;
      default: return <Badge variant="neutral">برنامه‌ریزی</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="danger">بسیار فوری</Badge>;
      case 'high': return <Badge variant="warning">بالا</Badge>;
      case 'medium': return <Badge variant="neutral">متوسط</Badge>;
      default: return <Badge variant="neutral">عادی</Badge>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            پروژه‌ها و جریان‌های کاری
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            رهگیری فازها، زمان‌بندی، وظایف و کنترل پیشرفت کارفرمایان
          </p>
        </div>

        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4 ml-1" />}>
          تعریف پروژه جدید
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="جستجو بر اساس نام پروژه یا کارفرما..."
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
              { value: 'planning', label: 'برنامه‌ریزی' },
              { value: 'in_progress', label: 'در حال اجرا' },
              { value: 'review', label: 'در حال بررسی' },
              { value: 'completed', label: 'تکمیل‌شده' },
              { value: 'on_hold', label: 'متوقف' },
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

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title="پروژه‌ای مطابق با شرایط جستجو یافت نشد"
          description="برای مدیریت کارها و ارجاع تسک‌ها، اولین پروژه سازمانی خود را ثبت کنید."
          actionText="تعریف اولین پروژه"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const totalTasks = p.tasks_count || 0;
            const completedTasks = p.completed_tasks_count || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <Card key={p.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {p.client_name || 'پروژه عمومی / داخلی'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(p.priority)}
                      {getStatusBadge(p.status)}
                    </div>
                  </div>

                  <Link to={`/app/projects/${p.id}`} className="mt-3 block group">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                  </Link>

                  {p.description && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Task Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                      <span>پیشرفت وظایف: {progress}٪</span>
                      <span>{completedTasks} از {totalTasks} تسک</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-500 tabular-nums">
                    {p.budget ? formatCurrency(p.budget) : 'بدون بودجه معین'}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="ویرایش پروژه"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="حذف پروژه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'ویرایش اطلاعات پروژه' : 'تعریف پروژه جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="عنوان پروژه"
            required
            placeholder="مثال: بازطراحی پرتال سازمانی و زیرساخت پرداخت"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Select
            label="کارفرما / مشتری مرتبط"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          >
            <option value="">پروژه عمومی / داخلی سازمان</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} ({c.contact_name})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="وضعیت اجرایی"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'planning', label: 'برنامه‌ریزی اولیه' },
                { value: 'in_progress', label: 'در حال اجرا' },
                { value: 'review', label: 'در حال تست و بررسی' },
                { value: 'completed', label: 'تکمیل‌شده' },
                { value: 'on_hold', label: 'متوقف‌شده' },
              ]}
            />

            <Select
              label="سطح اولویت"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={[
                { value: 'low', label: 'پایین' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'بالا' },
                { value: 'urgent', label: 'بسیار فوری' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="بودجه مصوب (تومان)"
              type="number"
              placeholder="مثال: 45000000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />

            <Input
              label="مهلت تحویل (Deadline)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <Textarea
            label="شرح و اهداف پروژه"
            rows={3}
            placeholder="اهداف اصلی، الزامات فنی و خروجی‌های مورد انتظار..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProject ? 'ذخیره تغییرات' : 'ایجاد پروژه'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
