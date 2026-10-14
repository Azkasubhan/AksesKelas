import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo AksesKelas resmi (ikon buku + teks) di sebelah kiri header.
 * Menggunakan file logo transparan yang proporsional dan tidak terdistorsi.
 */
export function Wordmark({
  href = "/",
  className,
  imageClassName,
}: {
  href?: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center transition-opacity hover:opacity-90 select-none",
        className,
      )}
      aria-label="AksesKelas, kembali ke beranda"
    >
      <Image
        src="/logo.png"
        alt="AksesKelas"
        width={480}
        height={138}
        priority
        className={cn("h-9 sm:h-11 w-auto shrink-0 object-contain", imageClassName)}
        style={{ width: "auto" }}
      />
    </Link>
  );
}
