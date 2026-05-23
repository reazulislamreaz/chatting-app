interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: "default" | "wa";
  refreshing?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  action,
  variant = "default",
  refreshing,
}: PageHeaderProps) {
  const isWa = variant === "wa";

  return (
    <div
      className={
        isWa
          ? "page-header !border-brand-700/20 !bg-brand-700 !text-white"
          : "page-header"
      }
    >
      <div className="page-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1
            className={`flex items-center gap-2 truncate text-lg font-bold tracking-tight sm:text-xl md:text-2xl ${
              isWa ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
            {refreshing && (
              <span
                className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand-500"
                aria-label="Updating"
              />
            )}
          </h1>
          {subtitle && (
            <p
              className={`mt-0.5 text-sm ${isWa ? "text-brand-100" : "text-slate-500"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 [&_.tab-pills]:w-full sm:[&_.tab-pills]:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
