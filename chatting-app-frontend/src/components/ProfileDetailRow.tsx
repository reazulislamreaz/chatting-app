interface ProfileDetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function ProfileDetailRow({ icon, label, value }: ProfileDetailRowProps) {
  if (!value?.trim()) return null;

  return (
    <div className="flex gap-3 rounded-xl bg-wa-panel/60 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
