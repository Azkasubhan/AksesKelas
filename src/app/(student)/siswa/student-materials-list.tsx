"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentMaterialItem } from "@/server/services/student-workspace.service";

interface StudentMaterialsListProps {
  materials: StudentMaterialItem[];
}

type FilterStatus = "all" | "sedang_dibaca" | "belum_dibaca" | "selesai";

export function StudentMaterialsList({ materials }: StudentMaterialsListProps) {
  const [filter, setFilter] = React.useState<FilterStatus>("all");

  const counts = React.useMemo(() => {
    return {
      all: materials.length,
      sedang_dibaca: materials.filter((m) => m.status === "sedang_dibaca").length,
      belum_dibaca: materials.filter((m) => m.status === "belum_dibaca").length,
      selesai: materials.filter((m) => m.status === "selesai").length,
    };
  }, [materials]);

  const filteredMaterials = React.useMemo(() => {
    if (filter === "all") return materials;
    return materials.filter((m) => m.status === filter);
  }, [materials, filter]);

  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-12 text-center shadow-xs">
        <h3 className="font-heading text-lg font-bold text-ink">
          Belum Ada Materi Tersedia
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
          Guru pengajar belum menerbitkan materi bacaan di kelas yang kamu ikuti. Materi baru akan otomatis muncul di sini setelah diterbitkan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs Segmented & Bersih */}
      <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface-subtle/80 p-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
            filter === "all"
              ? "bg-surface font-semibold text-ink shadow-xs border border-line/60"
              : "font-medium text-muted hover:text-ink"
          }`}
        >
          Semua ({counts.all})
        </button>

        {counts.sedang_dibaca > 0 && (
          <button
            type="button"
            onClick={() => setFilter("sedang_dibaca")}
            className={`rounded-lg px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
              filter === "sedang_dibaca"
                ? "bg-surface font-semibold text-ink shadow-xs border border-line/60"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            Sedang Dibaca ({counts.sedang_dibaca})
          </button>
        )}

        {counts.belum_dibaca > 0 && (
          <button
            type="button"
            onClick={() => setFilter("belum_dibaca")}
            className={`rounded-lg px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
              filter === "belum_dibaca"
                ? "bg-surface font-semibold text-ink shadow-xs border border-line/60"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            Belum Dibaca ({counts.belum_dibaca})
          </button>
        )}

        {counts.selesai > 0 && (
          <button
            type="button"
            onClick={() => setFilter("selesai")}
            className={`rounded-lg px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
              filter === "selesai"
                ? "bg-surface font-semibold text-ink shadow-xs border border-line/60"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            Selesai ({counts.selesai})
          </button>
        )}
      </div>

      {/* Grid Kartu Materi */}
      {filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted shadow-xs">
          Tidak ada materi dalam kategori status ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredMaterials.map((item) => {
            const isCompleted = item.status === "selesai";
            const isInProgress = item.status === "sedang_dibaca";

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
              >
                <div className="space-y-2.5">
                  {/* Header: Mapel & Status Bacaan */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-muted">
                      {item.subject}
                    </span>

                    {/* Status Pill */}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-ink">
                        <CheckCircle2 className="size-3 text-primary" aria-hidden="true" />
                        <span>Selesai</span>
                      </span>
                    )}

                    {isInProgress && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-ink">
                        <Clock className="size-3 text-primary" aria-hidden="true" />
                        <span>Sedang Dibaca</span>
                      </span>
                    )}

                    {!isCompleted && !isInProgress && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                        <span className="size-1.5 rounded-full bg-muted/60" aria-hidden="true" />
                        <span>Belum Dibaca</span>
                      </span>
                    )}
                  </div>

                  {/* Judul & Deskripsi */}
                  <div>
                    <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                      <Link href={`/siswa/kelas/${item.classId}/materi/${item.id}`} className="focus-visible:outline-focus">
                        {item.title}
                      </Link>
                    </h3>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Info Kelas & Guru */}
                  <div className="flex items-center gap-2 pt-0.5 text-xs text-muted">
                    <span className="font-medium text-ink">{item.className}</span>
                    <span className="text-line">•</span>
                    <span>Pengajar: {item.teacherName}</span>
                  </div>
                </div>

                {/* Footer Kartu: Progres & Tombol Aksi */}
                <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4">
                  <span className="text-xs font-medium text-muted">
                    {item.progressPositionText}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer group-hover:border-primary-border group-hover:text-primary"
                  >
                    <Link href={`/siswa/kelas/${item.classId}/materi/${item.id}`}>
                      <span>
                        {isInProgress
                          ? "Lanjutkan"
                          : isCompleted
                            ? "Baca Ulang"
                            : "Mulai Baca"}
                      </span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
