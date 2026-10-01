import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`theme-input w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${
              icon ? 'pr-10' : ''
            } ${
              error
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-rose-500">{error}</span>}
        {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
