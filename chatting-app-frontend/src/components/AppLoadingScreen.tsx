"use client";

export function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full flex-col items-center justify-center bg-wa-panel"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight text-slate-800">
        ChatFlow
      </p>
      <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-1/3 rounded-full bg-brand-500 animate-loading-bar" />
      </div>
    </div>
  );
}
