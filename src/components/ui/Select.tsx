import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`theme-input w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-rose-500">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`theme-input w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-500">{error}</span>}
        {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
