import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`glass rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, right }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between px-5 pt-4 pb-3">
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-sky-400">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'sky' | 'teal' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

const BADGE_COLORS: Record<string, string> = {
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export function Badge({ children, color = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${BADGE_COLORS[color]} ${className}`}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0-1
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color = 'from-sky-500 to-teal-400', className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 rounded-full bg-slate-700/50 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}
