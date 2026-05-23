interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: "default" | "wa";
}

export function PageHeader({
  title,
  subtitle,
  action,
  variant = "default",
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
      <div className="page-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1
            className={`truncate text-lg font-bold tracking-tight sm:text-xl md:text-2xl ${
              isWa ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`mt-0.5 text-sm ${isWa ? "text-brand-100" : "text-slate-500"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
