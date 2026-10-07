/** Error aplikasi dengan kode stabil untuk kontrak API (PRD bagian 11). */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthenticated: () =>
    new AppError("UNAUTHENTICATED", 401, "Sesi berakhir. Silakan masuk lagi."),
  forbidden: () =>
    new AppError("FORBIDDEN", 403, "Akun ini tidak memiliki akses untuk tindakan tersebut."),
  notFound: () =>
    new AppError("NOT_FOUND_OR_FORBIDDEN", 404, "Data tidak tersedia untuk akun ini."),
  badRequest: (message = "Permintaan tidak dapat dibaca.") =>
    new AppError("BAD_REQUEST", 400, message),
  validation: (fieldErrors: Record<string, string>, message = "Periksa kembali isian Anda.") =>
    new AppError("VALIDATION_FAILED", 422, message, fieldErrors),
  rateLimited: (retryAfterSeconds: number) =>
    new AppError(
      "RATE_LIMITED",
      429,
      `Terlalu banyak percobaan. Coba lagi dalam ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} menit.`,
    ),
  csrf: () =>
    new AppError("CSRF_FAILED", 403, "Permintaan ditolak karena tidak berasal dari aplikasi ini. Muat ulang halaman lalu coba lagi."),
};
