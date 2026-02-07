import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg p-4 hud-panel ${className}`}>{children}</div>;
}

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-hangar-accent px-3 py-2 text-sm text-white transition hover:brightness-110 ${className}`}
    />
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-hangar-slate/40 bg-transparent px-3 py-2 text-sm text-hangar-text placeholder:text-hangar-muted focus:outline-none focus:ring-2 focus:ring-hangar-cyan/40 ${className}`}
    />
  );
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-hangar-slate/40 bg-transparent px-3 py-2 text-sm text-hangar-text focus:outline-none focus:ring-2 focus:ring-hangar-cyan/40 hud-select ${className}`}
    />
  );
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-hangar-slate/40 bg-transparent px-3 py-2 text-sm text-hangar-text placeholder:text-hangar-muted focus:outline-none focus:ring-2 focus:ring-hangar-cyan/40 ${className}`}
    />
  );
}
