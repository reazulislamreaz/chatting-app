interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-4 py-8 safe-top safe-bottom lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-400 blur-3xl lg:h-96 lg:w-96" />
        <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-brand-500 blur-3xl lg:h-96 lg:w-96" />
      </div>

      <div className="relative grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Branding panel — visible on tablet/desktop */}
        <div className="hidden text-center lg:block lg:text-left">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white xl:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-brand-100 xl:text-lg">{subtitle}</p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100/90">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
              Real-time messaging with friends
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
              Voice calls and media sharing
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
              Social feed and profiles
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md animate-slide-up justify-self-center lg:max-w-none">
          {/* Mobile branding */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg sm:h-16 sm:w-16">
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-brand-100 sm:text-base">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8 lg:p-8">
            {children}
            <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
