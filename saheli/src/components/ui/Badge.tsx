import type { ComponentChildren } from 'preact';

interface BadgeProps {
  variant: 'Mild' | 'Moderate' | 'Moderate-severe' | 'Severe' | 'success' | 'warning' | 'error' | 'neutral' | 'Unknown';
  children: ComponentChildren;
  class?: string;
}

export function Badge({ variant, children, class: className = '' }: BadgeProps) {
  const getColors = () => {
    switch(variant) {
      case 'Mild':
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Moderate':
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Moderate-severe':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Severe':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()} ${className}`}>
      {children}
    </span>
  );
}
