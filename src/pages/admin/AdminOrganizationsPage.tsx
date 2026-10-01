import React, { useState, useEffect } from 'react';
import { Building, Users, FolderKanban, Receipt, Calendar } from 'lucide-react';
import { adminApi } from '../../api/miscApi.js';
import { Card } from '../../components/ui/Card.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminOrganizationsPage: React.FC = () => {
  const { error } = useToast();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getOrganizations()
      .then((res) => {
        if (res.success) setOrganizations(res.organizations);
      })
      .catch((e) => error(e.message || 'خطا در بارگذاری سازمان‌ها.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          سازمان‌ها و فضاهای کاری
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          فهرست شرکت‌های تجاری، مالکان و حجم منابع ایجادشده در هر فضای کاری
        </p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">نام سازمان و شناسه</th>
                  <th className="py-3 px-4">مالک / ایجادکننده</th>
                  <th className="py-3 px-4 tabular-nums">اعضای تیم</th>
                  <th className="py-3 px-4 tabular-nums">پروژه‌ها</th>
                  <th className="py-3 px-4 tabular-nums">فاکتورها</th>
                  <th className="py-3 px-4 tabular-nums">تاریخ ایجاد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block text-slate-900 dark:text-slate-100">{org.name}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{org.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span>{org.owner_name}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{org.owner_email}</span>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                      {org.members_count || 1}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {org.projects_count || 0}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                      {org.invoices_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                      {new Date(org.created_at).toLocaleDateString('fa-IR')}
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
