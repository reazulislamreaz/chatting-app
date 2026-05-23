interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-slide-up">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          {icon}
        </div>
      )}
      <p className="font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
      )}
    </div>
  );
}
