import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Phone, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { teamApi } from '../../api/miscApi.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'TEAM_MEMBER',
    password: '',
    phone: '',
  });

  // Change Role Modal
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('TEAM_MEMBER');
  const [isChangingRole, setIsChangingRole] = useState(false);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const res = await teamApi.list();
      if (res.success) {
        setMembers(res.members);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری اعضای تیم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.full_name.trim()) {
      error('ایمیل و نام و نام خانوادگی الزامی هستند.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await teamApi.invite(form);
      if (res.success) {
        success('عضو جدید با موفقیت به تیم اضافه شد.');
        setIsInviteModalOpen(false);
        setForm({
          email: '',
          full_name: '',
          role: 'TEAM_MEMBER',
          password: '',
          phone: '',
        });
        loadMembers();
      }
    } catch (err: any) {
      error(err.message || 'خطا در افزودن عضو جدید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setIsChangingRole(true);
      const res = await teamApi.updateRole(selectedMember.id, newRole);
      if (res.success) {
        success('نقش عضو تیم تغییر یافت.');
        setSelectedMember(null);
        loadMembers();
      }
    } catch (err: any) {
      error(err.message || 'خطا در تغییر نقش.');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleRemove = async (member: any) => {
    if (member.id === user?.id) {
      error('امکان حذف حساب کاربری خودتان از سازمان وجود ندارد.');
      return;
    }
    if (!window.confirm(`آیا از حذف دسترسی "${member.full_name}" مطمئن هستید؟`)) return;

    try {
      const res = await teamApi.remove(member.id);
      if (res.success) {
        success('عضو با موفقیت از تیم حذف شد.');
        loadMembers();
      }
    } catch (err: any) {
      error(err.message || 'خطا در حذف عضو.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge variant="danger">مدیر ارشد (Admin)</Badge>;
      case 'MANAGER': return <Badge variant="warning">مدیر پروژه (Manager)</Badge>;
      case 'TEAM_MEMBER': return <Badge variant="info">کارشناس تیم</Badge>;
      case 'CLIENT': return <Badge variant="neutral">کارفرما (Client)</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            اعضای تیم و سطوح دسترسی
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مدیریت همکاران، تعریف نقش‌ها و تعیین مجوزهای سازمانی
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsInviteModalOpen(true)} icon={<Plus className="w-4 h-4 ml-1" />}>
            افزودن عضو جدید
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="هیچ عضوی در سازمان یافت نشد"
            description="جهت همکاری مشترک، همکاران خود را به این سازمان دعوت فرمایید."
            actionText="افزودن همکار جدید"
            onAction={() => setIsInviteModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">مشخصات عضو</th>
                  <th className="py-3.5 px-4">ارتباطات</th>
                  <th className="py-3.5 px-4">نقش سازمانی</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 tabular-nums">تاریخ پیوستن</th>
                  {canManage && <th className="py-3.5 px-4 text-left">عملیات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {m.full_name ? m.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {m.full_name} {m.id === user?.id && <span className="text-xs text-indigo-600">(شما)</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{m.email}</span>
                      </div>
                      {m.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(m.role)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        فعال
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-slate-500">
                      {new Date(m.joined_at).toLocaleDateString('fa-IR')}
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {m.id !== user?.id && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedMember(m);
                                  setNewRole(m.role);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="تغییر نقش"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemove(m)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="حذف از تیم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="افزودن عضو جدید به تیم"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="نام و نام خانوادگی"
            required
            placeholder="مثال: مهرداد تهرانی"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />

          <Input
            label="آدرس ایمیل"
            type="email"
            required
            placeholder="mehrdad@agency.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Select
            label="نقش سازمانی و سطح دسترسی"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'TEAM_MEMBER', label: 'کارشناس تیم (دسترسی به وظایف و ثبت تسک)' },
              { value: 'MANAGER', label: 'مدیر پروژه (دسترسی به ایجاد مشتری، پروژه و فاکتور)' },
              ...(user?.role === 'ADMIN' ? [{ value: 'ADMIN', label: 'مدیر ارشد (دسترسی کامل به سامانه)' }] : []),
              { value: 'CLIENT', label: 'مشتری (مشاهده صرفاً پروژه‌ها و فاکتورهای خود)' },
            ]}
          />

          <Input
            label="شماره تماس (اختیاری)"
            type="tel"
            placeholder="09123456789"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Input
            label="کلمه عبور اولیه"
            type="password"
            placeholder="حداقل ۸ نویسه (پیش‌فرض: Atlas@123456)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              افزودن به سازمان
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `تغییر نقش: ${selectedMember.full_name}` : ''}
      >
        <form onSubmit={handleChangeRole} className="space-y-4">
          <Select
            label="نقش جدید"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'TEAM_MEMBER', label: 'کارشناس تیم' },
              { value: 'MANAGER', label: 'مدیر پروژه' },
              ...(user?.role === 'ADMIN' ? [{ value: 'ADMIN', label: 'مدیر ارشد' }] : []),
              { value: 'CLIENT', label: 'مشتری' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setSelectedMember(null)}>
              انصراف
            </Button>
            <Button type="submit" isLoading={isChangingRole}>
              ثبت تغییر نقش
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
