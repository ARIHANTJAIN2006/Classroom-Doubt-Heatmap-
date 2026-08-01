import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-line-strong bg-surface/60 px-8 py-16">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
