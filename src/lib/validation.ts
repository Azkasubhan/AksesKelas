import type { ZodType, ZodError } from "zod";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
  fieldErrors: Record<string, string>;
  generalError: null;
}

export interface ValidationFailure {
  success: false;
  data: null;
  fieldErrors: Record<string, string>;
  generalError: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Mengubah ZodError menjadi mapping key: error message yang ramah form input.
 */
export function formatZodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * Validasi data form di sisi klien menggunakan schema Zod bersama.
 * Memastikan prinsip Separation of Concerns: skema divalidasi dengan aturan yang sama persis seperti di backend.
 */
export function validateWithSchema<T>(
  schema: ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data,
      fieldErrors: {},
      generalError: null,
    };
  }

  const fieldErrors = formatZodFieldErrors(result.error);
  const firstError = Object.values(fieldErrors)[0] ?? "Data formulir belum valid.";

  return {
    success: false,
    data: null,
    fieldErrors,
    generalError: firstError,
  };
}
