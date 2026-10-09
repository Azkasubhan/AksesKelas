"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
}

/**
 * Komponen Input Angka Ketat.
 * Mencegah pengguna memasukkan karakter huruf atau simbol non-angka baik lewat ketikan maupun paste.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      allowDecimal = false,
      allowNegative = false,
      min,
      max,
      onKeyDown,
      onPaste,
      placeholder,
      disabled,
      ...props
    },
    ref,
  ) => {
    const stringValue = value !== undefined && value !== null ? String(value) : "";

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      // Izinkan tombol kontrol/navigasi sistem
      const isControlKey =
        e.key === "Backspace" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Delete" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "Enter" ||
        (e.ctrlKey || e.metaKey); // Ctrl+C, Ctrl+V, Cmd+A, dll.

      if (isControlKey) {
        onKeyDown?.(e);
        return;
      }

      // Desimal (titik/koma)
      if (allowDecimal && (e.key === "." || e.key === ",")) {
        const input = e.currentTarget;
        if (!input.value.includes(".") && !input.value.includes(",")) {
          onKeyDown?.(e);
          return;
        }
      }

      // Negatif (minus)
      if (allowNegative && e.key === "-") {
        const input = e.currentTarget;
        if (input.selectionStart === 0 && !input.value.includes("-")) {
          onKeyDown?.(e);
          return;
        }
      }

      // Hanya digit 0-9 yang diizinkan
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      onKeyDown?.(e);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/,/g, ".");
      if (raw === "") {
        onChange?.(undefined);
        return;
      }

      const num = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
      if (Number.isNaN(num)) {
        onChange?.(undefined);
        return;
      }

      // Validasi min/max opsional
      if (typeof max === "number" && num > max) {
        onChange?.(max);
        return;
      }
      if (typeof min === "number" && num < min) {
        onChange?.(min);
        return;
      }

      onChange?.(num);
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      const text = e.clipboardData.getData("text");
      // Cek apakah teks yang di-paste mengandung karakter non-angka
      const regex = allowDecimal
        ? allowNegative
          ? /^-?[0-9]*\.?[0-9]*$/
          : /^[0-9]*\.?[0-9]*$/
        : allowNegative
          ? /^-?[0-9]*$/
          : /^[0-9]*$/;

      if (!regex.test(text.trim())) {
        e.preventDefault();
        // Bersihkan dan hanya ambil angka
        const sanitized = text.replace(/[^0-9]/g, "");
        if (sanitized && onChange) {
          const num = parseInt(sanitized, 10);
          if (!Number.isNaN(num)) onChange(num);
        }
      }
      onPaste?.(e);
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern="[0-9]*"
        value={stringValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-input border border-control bg-surface px-3.5 text-base text-ink placeholder:text-[#7a8982] transition-colors duration-150 focus-visible:border-focus aria-[invalid=true]:border-danger disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";
