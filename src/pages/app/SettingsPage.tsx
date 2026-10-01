import React, { useState } from 'react';
import { User, Lock, Building, Sun, Moon, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useToast } from '../../context/ToastContext.js';
import { authApi } from '../../api/authApi.js';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('نام و نام خانوادگی الزامی است.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await authApi.updateProfile({
        full_name: fullName.trim(),
        phone: phone?.trim() || undefined,
      });

      if (res.success) {
        success('اطلاعات نمایه کاربری با موفقیت ذخیره شد.');
        updateUser({ full_name: fullName.trim(), phone: phone.trim() });
        refreshUser();
      }
    } catch (err: any) {
      error(err.message || 'خطا در ذخیره اطلاعات نمایه.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('کلمه عبور فعلی و جدید الزامی هستند.');
      return;
    }
    if (newPassword.length < 8) {
      error('کلمه عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('تکرار کلمه عبور جدید با آن همخوانی ندارد.');
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        success('کلمه عبور با موفقیت بروزرسانی شد.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.message || 'خطا در تغییر کلمه عبور.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          تنظیمات حساب و ترجیحات
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          مدیریت مشخصات هویتی، تدابیر امنیتی و ظاهر سامانه
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>پروفایل و هویت</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>امنیت و رمز عبور</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>ظاهر و پوسته</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="p-6 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            <Input
              label="نام و نام خانوادگی"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="آدرس ایمیل (غیرقابل تغییر)"
              type="email"
              disabled
              value={user?.email || ''}
              hint="آدرس ایمیل به عنوان شناسه اصلی حساب کاربری شما قفل گردیده است."
            />

            <Input
              label="شماره تماس"
              type="tel"
              placeholder="09120000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isSavingProfile}>
                ذخیره اطلاعات نمایه
              </Button>
            </div>
          </form>

          {/* Organization metadata */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              اطلاعات فضای کاری فعال
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">نام شرکت / سازمان</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-1 block">
                  {user?.company_name}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">نقش سازمانی شما</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-1 block">
                  {user?.role}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">طرح اشتراک</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-1 block uppercase">
                  {user?.plan || 'STANDARD'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="p-6 space-y-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <Input
              label="کلمه عبور فعلی"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="کلمه عبور جدید"
              type="password"
              required
              placeholder="حداقل ۸ نویسه..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="تکرار کلمه عبور جدید"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isSavingPassword}>
                بروزرسانی کلمه عبور
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Preferences / Theme Tab */}
      {activeTab === 'preferences' && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              پوسته و تم رابط کاربری
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              حالت نمایش دلخواه خود را برای کارکرد در ساعات مختلف شبانه‌روز انتخاب نمایید.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme('light')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTheme('light');
                  }
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-sm font-semibold block text-slate-900 dark:text-slate-100">پوسته روشن (Light)</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">محیط تمیز با کنتراست استاندارد</span>
                  </div>
                </div>
                {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme('dark')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTheme('dark');
                  }
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  <div>
                    <span className="text-sm font-semibold block text-slate-900 dark:text-slate-100">پوسته تاریک (Dark)</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">کاهش خستگی چشم در محیط کم‌نور</span>
                  </div>
                </div>
                {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
