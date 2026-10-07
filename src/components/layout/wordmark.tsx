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
        "group inline-flex items-center text-ink transition-opacity hover:opacity-90 select-none",
        className,
      )}
      aria-label="AksesKelas, kembali ke beranda"
    >
      <span className="font-sans text-[1.45rem] font-black tracking-tight text-black">
        AksesKelas
      </span>
    </Link>
  );
}
