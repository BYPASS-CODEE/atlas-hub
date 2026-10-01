import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Search, MessageSquare, Trash2, Edit2, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { tasksApi } from '../../api/tasksApi.js';
import { projectsApi } from '../../api/projectsApi.js';
import { teamApi } from '../../api/miscApi.js';
import { Task, Project } from '../../types/index.js';
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

export const TasksPage: React.FC = () => {
  const { success, error } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee_id: '',
    due_date: '',
  });

  // Comments Drawer / Modal
  const [activeTaskComments, setActiveTaskComments] = useState<Task | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, projRes, teamRes] = await Promise.all([
        tasksApi.list({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          project_id: projectFilter !== 'all' ? projectFilter : undefined,
        }),
        projectsApi.list(),
        teamApi.list(),
      ]);

      if (tasksRes.success) setTasks(tasksRes.tasks);
      if (projRes.success) setProjects(projRes.projects);
      if (teamRes.success) setTeamMembers(teamRes.members);
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری وظایف.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, projectFilter]);

  const handleOpenCreate = () => {
    if (projects.length === 0) {
      error('ابتدا باید حداقل یک پروژه تعریف نمایید تا تسک به آن اختصاص یابد.');
      return;
    }
    setEditingTask(null);
    setForm({
      project_id: projects[0]?.id || '',
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setForm({
      project_id: t.project_id,
      title: t.title,
      description: t.description || '',
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignee_id || '',
      due_date: t.due_date || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.project_id) {
      error('انتخاب پروژه و عنوان تسک الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTask) {
        const res = await tasksApi.update(editingTask.id, {
          ...form,
          status: form.status as any,
          priority: form.priority as any,
        });
        if (res.success) {
          success('تسک با موفقیت بروزرسانی شد.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await tasksApi.create({
          project_id: form.project_id,
          title: form.title,
          description: form.description || undefined,
          status: form.status,
          priority: form.priority,
          assignee_id: form.assignee_id || undefined,
          due_date: form.due_date || undefined,
        });
        if (res.success) {
          success('تسک جدید با موفقیت ثبت شد.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت اطلاعات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: Task) => {
    if (!window.confirm(`آیا از حذف تسک "${t.title}" مطمئن هستید؟`)) return;
    try {
      await tasksApi.delete(t.id);
      success('تسک حذف گردید.');
      loadData();
    } catch (err: any) {
      error(err.message || 'خطا در حذف تسک.');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await tasksApi.update(task.id, { status: nextStatus });
      loadData();
    } catch (e: any) {
      error(e.message || 'خطا در تغییر وضعیت.');
    }
  };

  const openComments = async (task: Task) => {
    setActiveTaskComments(task);
    try {
      const res = await tasksApi.getById(task.id);
      if (res.success && res.task) {
        setCommentsList(res.task.comments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTaskComments) return;

    try {
      setIsSubmittingComment(true);
      const res = await tasksApi.addComment(activeTaskComments.id, newComment.trim());
      if (res.success && res.comment) {
        setCommentsList([...commentsList, res.comment]);
        setNewComment('');
        success('دیدگاه با موفقیت ثبت شد.');
      }
    } catch (err: any) {
      error(err.message || 'خطا در ثبت دیدگاه.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            وظایف و تسک‌ها
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            برنامه‌ریزی، پیگیری و هماهنگی روزانه فعالیت‌های تیم
          </p>
        </div>

        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4 ml-1" />}>
          افزودن وظیفه جدید
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="جستجوی عنوان تسک یا شرح آن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'تمامی مراحل' },
              { value: 'todo', label: 'در صف انجام' },
              { value: 'in_progress', label: 'در حال انجام' },
              { value: 'review', label: 'در حال بررسی' },
              { value: 'done', label: 'انجام‌شده' },
            ]}
          />

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'all', label: 'تمامی اولویت‌ها' },
              { value: 'urgent', label: 'بسیار فوری' },
              { value: 'high', label: 'بالا' },
              { value: 'medium', label: 'متوسط' },
              { value: 'low', label: 'پایین' },
            ]}
          />

          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">تمامی پروژه‌ها</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Tasks List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-6 h-6" />}
            title="هیچ تسکی با این مشخصات یافت نشد"
            description="می‌توانید برای هر یک از پروژه‌های فعال تسک‌های جدید تعریف نمایید."
            actionText="تعریف اولین تسک"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      task.status === 'done'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-600'
                    }`}
                    aria-label="تغییر وضعیت تسک"
                  >
                    {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        task.status === 'done'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        پروژه: {task.project_name || 'نامشخص'}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString('fa-IR')}
                        </span>
                      )}
                      {task.assignee_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          مسئول: {task.assignee_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <Badge variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'neutral'}>
                    {task.priority === 'urgent' ? 'بسیار فوری' : task.priority === 'high' ? 'بالا' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                  </Badge>

                  <Badge variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'info' : 'neutral'}>
                    {task.status === 'done' ? 'تکمیل‌شده' : task.status === 'in_progress' ? 'در حال اجرا' : task.status === 'review' ? 'در حال بررسی' : 'در صف'}
                  </Badge>

                  <button
                    onClick={() => openComments(task)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                    title="دیدگاه‌ها و گفتگو"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {task.comments_count ? <span className="tabular-nums">{task.comments_count}</span> : null}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="ویرایش تسک"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(task)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="حذف تسک"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'ویرایش تسک' : 'ایجاد تسک جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="پروژه مرتبط"
            required
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Input
            label="عنوان تسک"
            required
            placeholder="مثال: طراحی پروتوتایپ صفحات در فیگما"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="وضعیت پیشرفت"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'todo', label: 'در صف انجام' },
                { value: 'in_progress', label: 'در حال انجام' },
                { value: 'review', label: 'در حال بررسی' },
                { value: 'done', label: 'انجام شد' },
              ]}
            />

            <Select
              label="اولویت"
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
            <Select
              label="کارشناس مسئول"
              value={form.assignee_id}
              onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
            >
              <option value="">بدون مسئول مشخص</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </Select>

            <Input
              label="مهلت انجام"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <Textarea
            label="شرح کامل کار"
            rows={3}
            placeholder="جزئیات و خروجی مورد انتظار از این تسک..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingTask ? 'ذخیره تغییرات' : 'ثبت تسک'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Comments Modal */}
      <Modal
        isOpen={Boolean(activeTaskComments)}
        onClose={() => setActiveTaskComments(null)}
        title={activeTaskComments ? `یادداشت‌ها و دیدگاه‌ها: ${activeTaskComments.title}` : ''}
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-3">
            {commentsList.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">
                هنوز هیچ دیدگاهی برای این تسک ثبت نشده است.
              </p>
            ) : (
              commentsList.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.user_name} ({c.user_role})</span>
                    <span className="tabular-nums">{new Date(c.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <Textarea
              placeholder="دیدگاه خود را درباره این تسک بنویسید..."
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={isSubmittingComment}>
                ثبت دیدگاه
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
