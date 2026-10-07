import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Waktu disimpan UTC; ditampilkan dalam zona Asia/Jakarta. */
export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}
