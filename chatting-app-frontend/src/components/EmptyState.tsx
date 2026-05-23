interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center animate-slide-up sm:py-16 md:py-20">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 md:h-20 md:w-20 md:rounded-3xl">
          {icon}
        </div>
      )}
      <p className="text-base font-medium text-slate-700 md:text-lg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-400 md:max-w-md md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
