"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Edit3,
  BookOpen,
  Sparkles,
  FileText,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { LessonDraftDto, SectionDto } from "@/shared/schemas/drafts-reader";
import type { SourceRevisionDetailDto } from "@/shared/schemas/materials";

interface TeacherDraftReviewProps {
  draft: LessonDraftDto;
  source: SourceRevisionDetailDto;
  csrfToken: string;
}

export function TeacherDraftReviewClient({
  draft: initialDraft,
  source,
  csrfToken,
}: TeacherDraftReviewProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<LessonDraftDto>(initialDraft);
  const [activeTab, setActiveTab] = React.useState<Record<string, "standard" | "easy" | "cards" | "glossary">>({});
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [unpublishing, setUnpublishing] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const sections = draft.content.sections;
  const approvals = draft.approvals;

  // Cek apakah seluruh bagian telah disetujui pada revisi yang sesuai
  const unapprovedSections = sections.filter((s) => {
    const app = approvals[s.id];
    return !app || app.sectionRevision !== s.revision;
  });
  const allApproved = unapprovedSections.length === 0;

  function getSectionTab(sectionId: string) {
    return activeTab[sectionId] || "cards";
  }

  function setSectionTab(sectionId: string, tab: "standard" | "easy" | "cards" | "glossary") {
    setActiveTab((prev) => ({ ...prev, [sectionId]: tab }));
  }

  // Handler Persetujuan Bagian
  async function handleApproveSection(sec: SectionDto) {
    setApprovingId(sec.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiFetch(`/materials/${draft.materialId}/draft/sections/${sec.id}/approve`, {
        method: "POST",
        body: {
          expectedRevision: draft.revision,
          expectedSectionRevision: sec.revision,
        },
        csrfToken,
      });

      // Update state lokal secara optimistik
      setDraft((prev) => {
        const newApprovals = {
          ...prev.approvals,
          [sec.id]: {
            sectionRevision: sec.revision,
            reviewedBy: "me",
            reviewedAt: new Date().toISOString(),
          },
        };
        return {
          ...prev,
          approvals: newApprovals,
          status:
            prev.content.sections.every(
              (s) => newApprovals[s.id]?.sectionRevision === s.revision,
            )
              ? "ready"
              : "review",
        };
      });

      setActionSuccess(`Bagian "${sec.title}" berhasil disetujui.`);
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError("Gagal menyetujui bagian.");
    } finally {
      setApprovingId(null);
    }
  }

  // Handler Publikasi ke Kelas
  async function handlePublish() {
    if (!allApproved) {
      setActionError("Seluruh bagian materi harus disetujui guru sebelum diterbitkan.");
      return;
    }

    setPublishing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await apiFetch<{ versionId: string; versionNumber: number }>(
        `/materials/${draft.materialId}/publish`,
        {
          method: "POST",
          body: {
            draftId: draft.id,
            expectedRevision: draft.revision,
          },
          csrfToken,
        },
      );

      setDraft((prev) => ({
        ...prev,
        isPublished: true,
        currentVersionId: res.versionId,
      }));

      setActionSuccess(
        `Materi berhasil diterbitkan untuk murid (Versi ${res.versionNumber})! Murid kini dapat mengakses materi di Ruang Belajar.`,
      );
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError("Gagal menerbitkan materi.");
    } finally {
      setPublishing(false);
    }
  }

  // Handler Tarik Publikasi (Unpublish)
  async function handleUnpublish() {
    setUnpublishing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiFetch(`/materials/${draft.materialId}/unpublish`, {
        method: "POST",
        csrfToken,
      });

      setDraft((prev) => ({
        ...prev,
        isPublished: false,
        currentVersionId: null,
      }));

      setActionSuccess("Publikasi materi berhasil ditarik dari akses murid.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError("Gagal menarik publikasi materi.");
    } finally {
      setUnpublishing(false);
    }
  }

  // Edit judul bagian
  function startEditSection(sec: SectionDto) {
    setEditingSectionId(sec.id);
    setEditTitle(sec.title);
  }

  async function handleSaveSectionEdit(sec: SectionDto) {
    if (!editTitle.trim()) return;

    try {
      const res = await apiFetch<{ draftRevision: number; sectionRevision: number }>(
        `/materials/${draft.materialId}/draft/sections/${sec.id}`,
        {
          method: "PATCH",
          body: {
            expectedRevision: draft.revision,
            title: editTitle.trim(),
          },
          csrfToken,
        },
      );

      setDraft((prev) => {
        const nextSections = prev.content.sections.map((s) =>
          s.id === sec.id
            ? { ...s, title: editTitle.trim(), revision: res.sectionRevision }
            : s,
        );
        // Reset approval
        const nextApprovals = { ...prev.approvals };
        delete nextApprovals[sec.id];

        return {
          ...prev,
          revision: res.draftRevision,
          content: { ...prev.content, sections: nextSections },
          approvals: nextApprovals,
          status: "review",
        };
      });

      setEditingSectionId(null);
      setActionSuccess("Judul bagian berhasil diperbarui. Status persetujuan direset untuk peninjauan ulang.");
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError("Gagal memperbarui judul bagian.");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {/* Subheader Navigasi & Info Draf */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md px-5 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/guru/kelas/${draft.classId}`}
              className="inline-flex size-8 items-center justify-center rounded-btn border border-line bg-surface text-muted hover:text-ink hover:bg-surface-subtle"
              aria-label="Kembali ke kelas"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">
                  {draft.className} • {draft.materialSubject}
                </span>
                <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-mono text-muted">
                  Draf R{draft.revision}
                </span>
                {draft.isPublished ? (
                  <span className="rounded bg-emerald-subtle px-1.5 py-0.5 text-[11px] font-semibold text-emerald">
                    Terbit untuk Siswa
                  </span>
                ) : (
                  <span className="rounded bg-amber-subtle px-1.5 py-0.5 text-[11px] font-semibold text-amber">
                    Draf Belum Terbit
                  </span>
                )}
              </div>
              <h1 className="font-heading text-lg font-bold text-ink sm:text-xl truncate max-w-xl">
                {draft.materialTitle}
              </h1>
            </div>
          </div>

          {/* Action Bar Publikasi */}
          <div className="flex items-center gap-3">
            {draft.isPublished ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleUnpublish} disabled={unpublishing}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>{unpublishing ? "Menarik…" : "Tarik Publikasi"}</span>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href={`/siswa/kelas/${draft.classId}/materi/${draft.materialId}`} target="_blank">
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Lihat di Reader Siswa</span>
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                disabled={publishing || !allApproved}
                className="gap-2 shadow-xs"
              >
                <Send className="size-4" aria-hidden="true" />
                <span>{publishing ? "Menerbitkan…" : "Terbitkan untuk Murid"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Konten Utama: Split View Peninjauan */}
      <main id="konten-utama" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {/* Banner Status Persetujuan */}
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-surface border border-line bg-surface p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-btn ${
                allApproved ? "bg-emerald-subtle text-emerald" : "bg-amber-subtle text-amber"
              }`}
            >
              {allApproved ? (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              ) : (
                <Clock className="size-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Status Persetujuan Guru: {sections.length - unapprovedSections.length} dari{" "}
                {sections.length} Bagian Disetujui
              </p>
              <p className="text-xs text-muted">
                {allApproved
                  ? "Semua bagian telah disetujui. Materi siap diterbitkan agar murid dapat membaca adaptasi ini."
                  : "Tinjau teks dan kartu tiap bagian di bawah ini, lalu klik 'Setujui Bagian Ini' untuk menerbitkan materi."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted">
              {source.blocks.length} Blok Rujukan Sumber Asli
            </span>
          </div>
        </div>

        {actionError ? (
          <Alert tone="danger" className="mb-6" role="alert">
            {actionError}
          </Alert>
        ) : null}

        {actionSuccess ? (
          <Alert tone="success" className="mb-6" role="status">
            {actionSuccess}
          </Alert>
        ) : null}

        {/* Layout: Sisi Sumber Asli vs Sisi Adaptasi */}
        <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
          {/* Kolom Kiri: Rujukan Teks Sumber Asli (Ground Truth) */}
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
            <div className="sticky top-24 rounded-surface border border-line bg-surface p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  <h2 className="font-heading text-sm font-bold text-ink">
                    Teks Sumber Asli ({source.inputType.toUpperCase()})
                  </h2>
                </div>
                <span className="text-xs text-muted">
                  Revisi {source.revisionNumber}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted leading-relaxed">
                Blok rujukan teks hasil ekstraksi yang menjadi acuan kebenaran ilmiah materi ini:
              </p>

              <div className="mt-4 max-h-[70vh] overflow-y-auto divide-y divide-line-subtle pr-2 text-xs">
                {source.blocks.map((block) => (
                  <div key={block.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-1">
                      <span className="font-semibold text-primary">Blok #{block.ordinal + 1}</span>
                      {block.pageNumber ? <span>Hlm {block.pageNumber}</span> : null}
                    </div>
                    <p className="font-sans leading-relaxed text-ink/80">{block.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Draf Adaptasi Multi-Modal Per Bagian */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
            {sections.map((sec, idx) => {
              const approval = approvals[sec.id];
              const isApproved = approval && approval.sectionRevision === sec.revision;
              const currentTab = getSectionTab(sec.id);

              return (
                <div
                  key={sec.id}
                  className={`rounded-surface border transition-all ${
                    isApproved
                      ? "border-emerald/40 bg-surface shadow-xs"
                      : "border-line bg-surface shadow-xs"
                  }`}
                >
                  {/* Header Bagian */}
                  <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs font-semibold text-muted">
                          Bagian {idx + 1}
                        </span>
                        <span className="text-xs font-mono text-muted">
                          R{sec.revision}
                        </span>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-subtle px-2 py-0.5 text-xs font-semibold text-emerald">
                            <Check className="size-3" aria-hidden="true" />
                            Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-subtle px-2 py-0.5 text-xs font-semibold text-amber">
                            <Clock className="size-3" aria-hidden="true" />
                            Perlu Persetujuan
                          </span>
                        )}
                      </div>

                      {editingSectionId === sec.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded-btn border border-line bg-canvas px-2.5 py-1 text-sm font-bold text-ink focus:border-primary focus:outline-none"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleSaveSectionEdit(sec)}>
                            Simpan
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingSectionId(null)}>
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg font-bold text-ink">{sec.title}</h3>
                          <button
                            type="button"
                            onClick={() => startEditSection(sec)}
                            className="rounded p-1 text-muted hover:text-ink hover:bg-surface-subtle"
                            title="Edit judul bagian"
                          >
                            <Edit3 className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tombol Persetujuan Bagian */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isApproved ? (
                        <div className="text-right text-[11px] text-muted">
                          <p className="font-semibold text-emerald">Telah Disetujui</p>
                          <p>{formatDate(approval.reviewedAt)}</p>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveSection(sec)}
                          disabled={approvingId === sec.id}
                          className="gap-1.5"
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          <span>{approvingId === sec.id ? "Menyimpan…" : "Setujui Bagian Ini"}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tab Pilihan Format Adaptasi */}
                  <div className="border-b border-line bg-surface-subtle/50 px-5 pt-3">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setSectionTab(sec.id, "cards")}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                          currentTab === "cards"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <Sparkles className="size-3.5" aria-hidden="true" />
                        <span>Kartu Fokus ({sec.cards.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionTab(sec.id, "easy")}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                          currentTab === "easy"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <BookOpen className="size-3.5" aria-hidden="true" />
                        <span>Teks Easy Read ({sec.easyRead.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionTab(sec.id, "standard")}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                          currentTab === "standard"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <FileText className="size-3.5" aria-hidden="true" />
                        <span>Teks Standard ({sec.standard.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionTab(sec.id, "glossary")}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                          currentTab === "glossary"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <HelpCircle className="size-3.5" aria-hidden="true" />
                        <span>Glosarium Istilah ({sec.glossary.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Isi Tab Format Adaptasi */}
                  <div className="p-5">
                    {/* 1. KARTU FOKUS (Focus Cards) */}
                    {currentTab === "cards" && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted">
                          Kartu fokus memecah materi menjadi satu konsep per kartu dengan dua varian teks berpasangan (Original dan Easy Read):
                        </p>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                          {sec.cards.map((card, cIdx) => (
                            <div
                              key={card.id || cIdx}
                              className="rounded-btn border border-line bg-canvas p-4 flex flex-col justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="font-semibold text-primary">
                                    {card.kind === "recap" ? "★ Ringkasan Kunci" : `Kartu ${cIdx + 1}`}
                                  </span>
                                  <span className="text-[11px] font-mono text-muted">
                                    {card.kind}
                                  </span>
                                </div>
                                <h4 className="font-heading text-sm font-bold text-ink">
                                  {card.title}
                                </h4>

                                <div className="mt-2 space-y-2 text-xs">
                                  <div className="rounded bg-surface p-2 border border-line-subtle">
                                    <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">
                                      Teks Original:
                                    </span>
                                    <p className="text-ink leading-relaxed">{card.originalText}</p>
                                  </div>

                                  <div className="rounded bg-primary-subtle/40 p-2 border border-primary/20">
                                    <span className="text-[10px] uppercase font-bold text-primary block mb-0.5">
                                      Varian Easy Read:
                                    </span>
                                    <p className="text-ink leading-relaxed font-medium">
                                      {card.easyText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. TEKS EASY READ */}
                    {currentTab === "easy" && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted">
                          Versi kalimat pendek dengan tata bahasa aktif dan struktur ramah kognitif untuk siswa yang membutuhkan penjelasan lebih sederhana:
                        </p>

                        <div className="space-y-2.5 rounded-btn bg-canvas p-4 border border-line text-sm leading-relaxed text-ink">
                          {sec.easyRead.map((er, erIdx) => (
                            <p key={erIdx} className="flex items-start gap-2.5">
                              <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                              <span>{er.text}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. TEKS STANDARD */}
                    {currentTab === "standard" && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted">
                          Teks lengkap sesuai dokumen materi pembelajaran asli:
                        </p>

                        <div className="space-y-3 rounded-btn bg-canvas p-4 border border-line text-sm leading-relaxed text-ink/90">
                          {sec.standard.map((std, sIdx) => (
                            <p key={sIdx}>{std.text}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. GLOSARIUM */}
                    {currentTab === "glossary" && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted">
                          Istilah penting yang ditemukan pada bagian ini beserta definisi ramah siswa:
                        </p>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {sec.glossary.map((glo, gIdx) => (
                            <div
                              key={gIdx}
                              className="rounded-btn border border-line bg-canvas p-3 text-xs"
                            >
                              <span className="font-heading font-bold text-primary block text-sm">
                                {glo.term}
                              </span>
                              <p className="mt-1 text-ink/80 leading-relaxed">
                                {glo.definition}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
