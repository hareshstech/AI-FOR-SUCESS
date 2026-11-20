import React, { useEffect } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function NexoraLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          className="fill-[var(--nx-accent-primary)]"
        />
        <path
          d="M7.5 16.5V7.5L12.5 13.5L16.5 7.5V16.5"
          stroke="#F7F6FC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-base font-bold tracking-tight text-[var(--nx-text-primary)]">
        NEXORA
      </span>
    </span>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]';

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)] hover:bg-[var(--nx-accent-primary-hover)] shadow-[var(--nx-shadow-sm)]',
    secondary:
      'bg-[var(--nx-surface-base)] text-[var(--nx-text-primary)] border border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-elevated)]',
    ghost:
      'bg-transparent text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)]',
    destructive:
      'bg-[var(--nx-error-bg)] text-[var(--nx-error)] border border-[var(--nx-error)]/25 hover:bg-[var(--nx-error)] hover:text-white',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'secondary' | 'destructive';
}

export function IconButton({
  label,
  variant = 'ghost',
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const styles =
    variant === 'secondary'
      ? 'bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)] text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)]'
      : variant === 'destructive'
        ? 'text-[var(--nx-text-muted)] hover:text-[var(--nx-error)] hover:bg-[var(--nx-error-bg)]'
        : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)]';

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', interactive = false, onClick }: CardProps) {
  const base =
    'rounded-xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)] p-5 transition-colors duration-150';
  const hover = interactive
    ? 'hover:border-[var(--nx-border-strong)] cursor-pointer'
    : '';
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${base} ${hover} ${className}`}
      >
        {children}
      </div>
    );
  }
  return <div className={`${base} ${hover} ${className}`}>{children}</div>;
}

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, hint, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-[var(--nx-text-secondary)] tracking-wide"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--nx-error)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--nx-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBaseClass =
  'w-full rounded-lg bg-[var(--nx-bg-primary)] border border-[var(--nx-border-subtle)] px-3.5 py-2.5 text-sm text-[var(--nx-text-primary)] placeholder:text-[var(--nx-text-muted)] transition-colors hover:border-[var(--nx-border-strong)] focus:border-[var(--nx-accent-primary)] focus:outline-none disabled:opacity-70 disabled:bg-[var(--nx-surface-elevated)]/40 disabled:cursor-not-allowed';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-10 ${inputBaseClass} ${className}`} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputBaseClass} leading-relaxed resize-y ${className}`} {...props} />;
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`h-10 ${inputBaseClass} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'Search',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-[var(--nx-text-muted)] absolute left-3 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`h-10 w-full rounded-lg bg-[var(--nx-bg-primary)] border border-[var(--nx-border-subtle)] pl-9 pr-8 text-sm text-[var(--nx-text-primary)] placeholder:text-[var(--nx-text-muted)] hover:border-[var(--nx-border-strong)] focus:border-[var(--nx-accent-primary)] focus:outline-none`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 rounded text-[var(--nx-text-muted)] hover:text-[var(--nx-text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, label, showValue = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--nx-text-secondary)]">{label || 'Progress'}</span>
          {showValue && (
            <span className="font-mono-num font-medium text-[var(--nx-text-primary)]">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Completion progress'}
        className="h-2 w-full rounded-full bg-[var(--nx-surface-elevated)] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[var(--nx-accent-primary)] transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nexora-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-strong)] p-6 shadow-[var(--nx-shadow-md)]`}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2
                  id="nexora-modal-title"
                  className="font-display text-lg font-semibold text-[var(--nx-text-primary)]"
                >
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-[var(--nx-text-secondary)] mt-1">{description}</p>
                )}
              </div>
              <IconButton label="Close modal" onClick={onClose}>
                <X className="w-4 h-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-dashed border-[var(--nx-border-strong)] bg-[var(--nx-surface-base)]/50">
      <div className="w-11 h-11 rounded-xl bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-[var(--nx-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--nx-text-secondary)] max-w-md mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonRow({ className = 'h-12' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full rounded-lg bg-[var(--nx-surface-elevated)]/60 animate-pulse ${className}`}
    />
  );
}
