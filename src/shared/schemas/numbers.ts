import { z } from "zod";

/**
 * Validasi ketat input angka.
 * Menolak string non-numerik, NaN, Infinity, dan angka di luar batasan yang diizinkan.
 */

export interface NumberRangeOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  label?: string;
}

/**
 * Skema angka ketat yang mengurai dan memvalidasi nilai angka (menerima number atau numeric string).
 */
export function createNumberSchema(options: NumberRangeOptions = {}) {
  const { min, max, integer = false, label = "Nilai" } = options;

  let schema = z.coerce.number({
    error: (iss) =>
      iss.code === "invalid_type"
        ? `${label} harus berupa angka yang valid`
        : undefined,
  });

  // Pastikan bukan NaN atau Infinity
  schema = schema.refine(
    (val) => Number.isFinite(val),
    `${label} harus berupa angka yang terhingga (bukan NaN atau tak hingga)`,
  );

  if (integer) {
    schema = schema.refine(
      (val) => Number.isInteger(val),
      `${label} harus berupa bilangan bulat tanpa desimal`,
    );
  }

  if (typeof min === "number") {
    schema = schema.refine(
      (val) => val >= min,
      `${label} minimal bernilai ${min}`,
    );
  }

  if (typeof max === "number") {
    schema = schema.refine(
      (val) => val <= max,
      `${label} maksimal bernilai ${max}`,
    );
  }

  return schema;
}

/** Skema bilangan bulat positif (contoh: nomor halaman, jumlah kartu) */
export const positiveIntSchema = createNumberSchema({
  min: 1,
  integer: true,
  label: "Angka",
});

/** Skema nomor halaman (1 sampai 9999) */
export const pageNumberSchema = createNumberSchema({
  min: 1,
  max: 9999,
  integer: true,
  label: "Nomor halaman",
});

/** Skema ukuran font pembaca (12px sampai 36px) */
export const fontSizeSchema = createNumberSchema({
  min: 12,
  max: 36,
  integer: true,
  label: "Ukuran font",
});

/** Skema kecepatan suara bacaan (0.5x sampai 2.0x) */
export const speechRateSchema = createNumberSchema({
  min: 0.5,
  max: 2.0,
  integer: false,
  label: "Kecepatan suara",
});
