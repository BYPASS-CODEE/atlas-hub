import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FolderKanban, ArrowRight, Building2, Plus, Calendar, CheckSquare, Clock, Users, Trash2 } from 'lucide-react';
import { projectsApi } from '../../api/projectsApi.js';
import { tasksApi } from '../../api/tasksApi.js';
import { teamApi } from '../../api/miscApi.js';
import { Project, Task } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { useToast } from '../../context/ToastContext.js';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();

  const [project, setProject] = useState<(Project & { tasks: Task[]; members: any[] }) | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee_id: '',
    due_date: '',
  });

  const loadProject = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [projRes, teamRes] = await Promise.all([
        projectsApi.getById(id),
        teamApi.list(),
      ]);
      if (projRes.success && projRes.project) {
        setProject(projRes.project);
      }
      if (teamRes.success) {
        setTeamMembers(teamRes.members);
      }
    } catch (err: any) {
      error(err.message || 'خطا در دریافت اطلاعات پروژه.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      error('عنوان تسک الزامی است.');
      return;
    }

    try {
      setIsSubmittingTask(true);
      const res = await tasksApi.create({
        project_id: id!,
        title: taskForm.title,
        description: taskForm.description || undefined,
        status: taskForm.status,
        priority: taskForm.priority,
        assignee_id: taskForm.assignee_id || undefined,
        due_date: taskForm.due_date || undefined,
      });

      if (res.success) {
        success('تسک با موفقیت اضافه شد.');
        setIsTaskModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assignee_id: '',
          due_date: '',
        });
        loadProject();
      }
    } catch (err: any) {
      error(err.message || 'خطا در ایجاد تسک.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleTaskStatusToggle = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await tasksApi.update(task.id, { status: nextStatus });
      loadProject();
    } catch (e: any) {
      error(e.message || 'خطا در بروزرسانی وضعیت تسک.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">پروژه مورد نظر یافت نشد.</p>
        <Link to="/app/projects">
          <Button variant="outline" size="sm">
            بازگشت به فهرست پروژه‌ها
          </Button>
        </Link>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header and Back navigation */}
      <div>
        <Link to="/app/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به فهرست پروژه‌ها</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {project.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                {project.client_name ? (
                  <Link to={`/app/clients/${project.client_id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{project.client_name}</span>
                  </Link>
                ) : (
                  <span>پروژه عمومی</span>
                )}
                <span>·</span>
                <span className="tabular-nums">مهلت: {project.deadline ? new Date(project.deadline).toLocaleDateString('fa-IR') : 'تعیین نشده'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              افزودن وظیفه (تسک)
            </Button>
          </div>
        </div>
      </div>

      {/* Project Status & Progress Bar */}
      <Card className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">وضعیت کلی پروژه</span>
            <span className="mt-1 block">
              <Badge variant={project.status === 'completed' ? 'success' : 'info'}>
                {project.status}
              </Badge>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">سطح اولویت</span>
            <span className="mt-1 block">
              <Badge variant={project.priority === 'urgent' ? 'danger' : 'neutral'}>
                {project.priority}
              </Badge>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">بودجه مصوب</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold tabular-nums mt-1 block">
              {formatCurrency(project.budget || 0)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">وظایف تکمیل‌شده</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold tabular-nums mt-1 block">
              {completedTasks} از {tasks.length} ({progress}٪)
            </span>
          </div>
        </div>

        {/* Visual Progress Meter */}
        <div className="space-y-1.5 pt-2">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {project.description && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">شرح پروژه:</span>
            {project.description}
          </div>
        )}
      </Card>

      {/* Tasks List */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-500" />
            <span>وظایف این پروژه ({tasks.length})</span>
          </h2>
          <Button size="sm" variant="ghost" onClick={() => setIsTaskModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            تسک جدید
          </Button>
        </div>

        <div className="mt-4">
          {tasks.length === 0 ? (
            <EmptyState
              title="هنوز وظیفه‌ای برای این پروژه ثبت نشده است"
              description="اقدامات اجرایی پروژه را به تسک‌های کوچک‌تر تقسیم کرده و به اعضای تیم محول فرمایید."
              actionText="افزودن اولین تسک"
              onAction={() => setIsTaskModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 truncate">
                    <button
                      onClick={() => handleTaskStatusToggle(task)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-600'
                      }`}
                      aria-label="تغییر وضعیت"
                    >
                      {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                    <div className="truncate">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.priority === 'urgent' ? 'danger' : 'neutral'}>
                      {task.priority}
                    </Badge>
                    {task.assignee_name && (
                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {task.assignee_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="افزودن تسک جدید به پروژه"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="عنوان تسک"
            required
            placeholder="مثال: پیاده‌سازی صفحه ورود و فرم ثبت نام"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="سطح اولویت"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              options={[
                { value: 'low', label: 'پایین' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'بالا' },
                { value: 'urgent', label: 'بسیار فوری' },
              ]}
            />

            <Select
              label="ارجاع به کارشناس"
              value={taskForm.assignee_id}
              onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
            >
              <option value="">بدون مسئول مشخص</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="مهلت انجام (اختیاری)"
            type="date"
            value={taskForm.due_date}
            onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
          />

          <Textarea
            label="توضیحات و جزئیات تسک"
            rows={3}
            placeholder="نیازمندی‌ها، لینک‌ها یا مستندات مرتبط..."
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmittingTask}>
              ثبت وظیفه
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
