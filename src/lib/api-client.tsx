"use client";

import * as React from "react";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: "GET" | "POST" | "PATCH" | "PUT"; body?: unknown; csrfToken?: string } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(opts.csrfToken ? { "x-csrf-token": opts.csrfToken } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      0,
      "Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.",
    );
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(
      e?.code ?? "UNKNOWN",
      res.status,
      e?.message ?? "Terjadi kesalahan. Coba lagi sebentar lagi.",
      e?.fieldErrors ?? {},
      e?.requestId,
    );
  }
  return json.data as T;
}

const CsrfContext = React.createContext<string>("");

export function CsrfProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

export function useCsrf(): string {
  return React.useContext(CsrfContext);
}
