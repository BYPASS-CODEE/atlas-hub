import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Building, User, Phone, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'ضعیف', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'متوسط', color: 'bg-amber-500' };
    return { score: 3, label: 'بسیار قوی', color: 'bg-emerald-500' };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.company_name.trim() || !formData.password) {
      setErrorMsg('لطفاً فیلدهای الزامی (نام، ایمیل، شرکت و رمز عبور) را تکمیل فرمایید.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg('کلمه عبور باید حداقل ۸ نویسه باشد.');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        full_name: formData.full_name,
        email: formData.email,
        company_name: formData.company_name,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      navigate('/app', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در فرآیند ثبت‌نام.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="theme-page min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            ATLAS HUB
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            ایجاد فضای کاری جدید
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            یک فضای کاری مستقل، امن و تفکیک‌شده برای شرکت یا آژانس شما ایجاد می‌گردد
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block border-b border-slate-100 dark:border-slate-800 pb-1">
                اطلاعات مدیر و نماینده
              </span>

              <Input
                label="نام و نام خانوادگی"
                required
                placeholder="مثال: سارا کاظمی"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                icon={<User className="w-4 h-4" />}
              />

              <Input
                label="آدرس ایمیل سازمانی"
                type="email"
                required
                placeholder="sara@agency.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="شماره تماس (اختیاری)"
                type="tel"
                placeholder="09123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block border-b border-slate-100 dark:border-slate-800 pb-1">
                مشخصات سازمان
              </span>

              <Input
                label="نام شرکت / آژانس یا استودیو"
                required
                placeholder="مثال: استودیو دیجیتال آرتام"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                icon={<Building className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block border-b border-slate-100 dark:border-slate-800 pb-1">
                امنیت حساب
              </span>

              <div className="relative">
                <Input
                  label="کلمه عبور"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="حداقل ۸ نویسه..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  aria-label={showPassword ? 'مخفی کردن' : 'نمایش'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>قدرت رمز عبور: {passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : ''}`} />
                    <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : ''}`} />
                    <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : ''}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<ArrowLeft className="w-4 h-4 ml-1" />}
              >
                ایجاد فضای کاری و شروع به کار
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                ورود به حساب کاربری
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
