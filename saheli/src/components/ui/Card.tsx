import type { ComponentChildren } from 'preact';

interface CardProps {
  children: ComponentChildren;
  class?: string;
  onClick?: () => void;
}

export function Card({ children, class: className = '', onClick }: CardProps) {
  const isClickable = !!onClick;
  return (
    <div 
      onClick={onClick}
      class={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 ${isClickable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
