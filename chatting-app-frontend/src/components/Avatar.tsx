import { getUploadUrl } from "@/lib/api";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs ring-2",
  md: "h-10 w-10 text-sm ring-2",
  lg: "h-16 w-16 text-xl ring-[3px]",
  xl: "h-24 w-24 text-2xl ring-[3px]",
};

export function Avatar({ name, src, size = "md", online }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const imageUrl = getUploadUrl(src);

  return (
    <div className="relative inline-flex shrink-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-white`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white ring-white`}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            online ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      )}
    </div>
  );
}
