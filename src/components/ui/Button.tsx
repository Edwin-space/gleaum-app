'use client';

import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-100 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:  'text-white rounded-full',
      secondary:'border rounded-full',
      ghost:    'rounded-full',
      danger:   'text-red-500 rounded-full',
      gradient: 'text-white rounded-full',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2 h-8',
      md: 'text-[15px] px-5 py-[11px] h-[44px]',
      lg: 'text-[17px] px-7 py-[14px] h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        style={
          variant === 'primary' ? { background: 'var(--color-primary)' } :
          variant === 'gradient' ? { background: 'var(--brand-gradient)' } :
          variant === 'secondary' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } :
          variant === 'ghost' ? { color: 'var(--color-primary)' } :
          undefined
        }
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            처리 중...
          </span>
        ) : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
