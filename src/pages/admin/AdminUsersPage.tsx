import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import { adminApi } from '../../api/miscApi.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getUsers();
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      error(err.message || 'خطا در بارگذاری فهرست کاربران.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user: any) => {
    if (user.id === currentUser?.id) {
      error('امکان تغییر وضعیت حساب کاربری خودتان وجود ندارد.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminApi.updateUserStatus(user.id, nextStatus);
      if (res.success) {
        success(res.message);
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'خطا در تغییر وضعیت کاربر.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.organization_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            مدیریت فراگیر کاربران
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده، نظارت و کنترل وضعیت فعال/معلق کلیه حساب‌های کاربری ثبت‌شده
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="جستجوی نام یا ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">نام و ایمیل</th>
                  <th className="py-3 px-4">سازمان فعال</th>
                  <th className="py-3 px-4">نقش</th>
                  <th className="py-3 px-4">وضعیت حساب</th>
                  <th className="py-3 px-4 tabular-nums">تاریخ ثبت‌نام</th>
                  <th className="py-3 px-4 text-left">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block text-slate-900 dark:text-slate-100">{u.full_name}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {u.organization_name || 'بدون سازمان'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'active' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          فعال
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          معلق / مسدود
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                      {new Date(u.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      {u.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant={u.status === 'active' ? 'danger' : 'outline'}
                          onClick={() => handleToggleStatus(u)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          {u.status === 'active' ? 'مسدودسازی' : 'رفع مسدودی'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
