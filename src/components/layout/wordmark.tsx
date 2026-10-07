import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 text-ink transition-opacity hover:opacity-90",
        className,
      )}
      aria-label="AksesKelas, kembali ke beranda"
    >
      {/* Logomark: Simbol tiga lapisan bacaan terstruktur dengan presisi geometris */}
      <span className="flex size-7 items-center justify-center rounded-btn bg-gradient-to-br from-primary to-violet text-white shadow-sm shadow-primary/25 transition-transform duration-200 group-hover:scale-95">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="2.5" y="3" width="11" height="2" rx="1" fill="currentColor" />
          <rect x="2.5" y="7" width="8" height="2" rx="1" fill="currentColor" fillOpacity="0.85" />
          <rect x="2.5" y="11" width="5.5" height="2" rx="1" fill="currentColor" fillOpacity="0.7" />
        </svg>
      </span>
      <span className="font-heading text-lg font-bold tracking-tight text-ink">
        AksesKelas
      </span>
    </Link>
  );
}
