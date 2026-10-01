import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session_expired');

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('لطفاً ایمیل و کلمه عبور را وارد فرمایید.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'اطلاعات ورود نادرست است.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="theme-page min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            ATLAS HUB
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            ورود به فضای کاری
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            جهت دسترسی به پروژه‌ها و پنل عملیاتی وارد شوید
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {sessionExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              نشست کاربری شما پایان یافته است. لطفاً مجدداً وارد شوید.
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="آدرس ایمیل"
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <div className="relative">
              <Input
                label="کلمه عبور"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<ArrowLeft className="w-4 h-4 ml-1" />}
              >
                ورود به حساب
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              هنوز حسابی ندارید؟{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                ثبت نام و ایجاد فضای کاری
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
