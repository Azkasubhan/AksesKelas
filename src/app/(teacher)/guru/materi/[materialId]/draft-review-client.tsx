"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
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
  Columns2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteMaterialModal } from "@/components/teacher/delete-material-modal";
import { AiProcessingModal } from "@/components/teacher/ai-processing-modal";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import type {
  LessonDraftDto,
  SectionDto,
  SectionCardDto,
  SectionItemDto,
  SectionGlossaryDto,
} from "@/shared/schemas/drafts-reader";
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

  // State untuk editing kartu fokus, easy read, standard, dan glosarium
  const [editingCard, setEditingCard] = React.useState<{
    sectionId: string;
    cardId: string;
    title: string;
    originalText: string;
    easyText: string;
  } | null>(null);
  const [editingEasyReadSecId, setEditingEasyReadSecId] = React.useState<string | null>(null);
  const [easyReadDrafts, setEasyReadDrafts] = React.useState<string[]>([]);
  const [editingStandardSecId, setEditingStandardSecId] = React.useState<string | null>(null);
  const [standardDrafts, setStandardDrafts] = React.useState<string[]>([]);
  const [editingGlossarySecId, setEditingGlossarySecId] = React.useState<string | null>(null);
  const [glossaryDrafts, setGlossaryDrafts] = React.useState<Array<{ term: string; definition: string }>>([]);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [unpublishing, setUnpublishing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [confirmingSource, setConfirmingSource] = React.useState(false);
  const [sourceConfirmed, setSourceConfirmed] = React.useState(!!source.confirmedAt);
  const [showSource, setShowSource] = React.useState(true);

  async function handleRegenerate() {
    setGenerating(true);
    try {
      await apiFetch(`/materials/${draft.materialId}/generate`, {
        method: "POST",
        body: { sourceRevisionId: source.id },
        csrfToken,
      });
      const freshDraft = await apiFetch<LessonDraftDto>(`/materials/${draft.materialId}/draft`);
      setDraft(freshDraft);
      toast.success("Adaptasi materi baru berhasil disusun dengan AI!");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal menyusun adaptasi materi dengan AI.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirmSource() {
    setConfirmingSource(true);
    try {
      await apiFetch(`/materials/${draft.materialId}/source-confirm`, {
        method: "POST",
        body: { sourceRevisionId: source.id },
        csrfToken,
      });
      setSourceConfirmed(true);
      toast.success("Blok rujukan teks sumber berhasil dikonfirmasi sebagai acuan pembelajaran.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal mengonfirmasi blok sumber.");
    } finally {
      setConfirmingSource(false);
    }
  }

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

      toast.success(`Bagian "${sec.title}" berhasil disetujui.`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal menyetujui bagian.");
    } finally {
      setApprovingId(null);
    }
  }

  // Handler Publikasi ke Kelas
  async function handlePublish() {
    if (!allApproved) {
      toast.warning("Seluruh bagian materi harus disetujui guru sebelum diterbitkan.");
      return;
    }

    setPublishing(true);

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

      toast.success(
        `Materi berhasil diterbitkan untuk murid (Versi ${res.versionNumber})! Murid kini dapat mengakses materi di Ruang Belajar.`,
      );
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal menerbitkan materi.");
    } finally {
      setPublishing(false);
    }
  }

  // Handler Tarik Publikasi (Unpublish)
  async function handleUnpublish() {
    setUnpublishing(true);

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

      toast.success("Publikasi materi berhasil ditarik dari akses murid.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal menarik publikasi materi.");
    } finally {
      setUnpublishing(false);
    }
  }

  // Helper generik untuk memutasi bagian draf dan mereset status persetujuan guru (Human-in-the-Loop)
  async function applySectionMutation(
    sec: SectionDto,
    patch: {
      title?: string;
      cards?: SectionCardDto[];
      easyRead?: Array<{ text: string; sourceRefs: string[] }>;
      standard?: Array<{ text: string; sourceRefs: string[] }>;
      glossary?: Array<{ term: string; definition: string; sourceRefs: string[] }>;
    },
    successMessage: string,
  ): Promise<boolean> {
    setSavingEdit(true);
    try {
      const res = await apiFetch<{ draftRevision: number; sectionRevision: number }>(
        `/materials/${draft.materialId}/draft/sections/${sec.id}`,
        {
          method: "PATCH",
          body: {
            expectedRevision: draft.revision,
            ...patch,
          },
          csrfToken,
        },
      );

      setDraft((prev) => {
        const nextSections = prev.content.sections.map((s) => {
          if (s.id !== sec.id) return s;
          return {
            ...s,
            revision: res.sectionRevision,
            title: patch.title !== undefined ? patch.title : s.title,
            cards: patch.cards !== undefined ? patch.cards : s.cards,
            easyRead: patch.easyRead !== undefined ? patch.easyRead : s.easyRead,
            standard: patch.standard !== undefined ? patch.standard : s.standard,
            glossary: patch.glossary !== undefined ? patch.glossary : s.glossary,
          };
        });

        // Reset approval untuk bagian ini karena isi baru perlu ditinjau ulang guru
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

      toast.success(`${successMessage} Status persetujuan bagian ini direset untuk peninjauan ulang.`);
      return true;
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal menyimpan perubahan.");
      return false;
    } finally {
      setSavingEdit(false);
    }
  }

  // 1. Edit judul bagian
  function startEditSection(sec: SectionDto) {
    setEditingSectionId(sec.id);
    setEditTitle(sec.title);
  }

  async function handleSaveSectionEdit(sec: SectionDto) {
    if (!editTitle.trim()) return;
    const ok = await applySectionMutation(
      sec,
      { title: editTitle.trim() },
      `Judul bagian berhasil diubah menjadi "${editTitle.trim()}".`,
    );
    if (ok) setEditingSectionId(null);
  }

  // 2. Edit Kartu Fokus
  function startEditCard(sectionId: string, card: SectionCardDto) {
    setEditingCard({
      sectionId,
      cardId: card.id,
      title: card.title,
      originalText: card.originalText,
      easyText: card.easyText,
    });
  }

  async function handleSaveCard(sec: SectionDto) {
    if (!editingCard) return;
    if (!editingCard.title.trim()) {
      toast.warning("Judul kartu tidak boleh kosong.");
      return;
    }
    const nextCards = sec.cards.map((c) =>
      c.id === editingCard.cardId
        ? {
            ...c,
            title: editingCard.title.trim(),
            originalText: (editingCard.originalText || c.originalText || editingCard.easyText).trim(),
            easyText: editingCard.easyText.trim(),
          }
        : c,
    );
    const ok = await applySectionMutation(
      sec,
      { cards: nextCards },
      `Kartu "${editingCard.title}" berhasil diperbarui.`,
    );
    if (ok) setEditingCard(null);
  }

  // 3. Edit Teks Easy Read
  function startEditEasyRead(sec: SectionDto) {
    setEditingEasyReadSecId(sec.id);
    setEasyReadDrafts(sec.easyRead.map((er) => er.text));
  }

  async function handleSaveEasyRead(sec: SectionDto) {
    const validTexts = easyReadDrafts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (validTexts.length === 0) {
      toast.warning("Teks Easy Read minimal memiliki 1 butir kalimat.");
      return;
    }
    const nextEasyRead = validTexts.map((text, idx) => ({
      text,
      sourceRefs: sec.easyRead[idx]?.sourceRefs || sec.sourceRefs,
    }));
    const ok = await applySectionMutation(
      sec,
      { easyRead: nextEasyRead },
      "Teks Easy Read berhasil diperbarui.",
    );
    if (ok) setEditingEasyReadSecId(null);
  }

  // 4. Edit Teks Standard
  function startEditStandard(sec: SectionDto) {
    setEditingStandardSecId(sec.id);
    setStandardDrafts(sec.standard.map((std) => std.text));
  }

  async function handleSaveStandard(sec: SectionDto) {
    const validTexts = standardDrafts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (validTexts.length === 0) {
      toast.warning("Teks Standard minimal memiliki 1 paragraf.");
      return;
    }
    const nextStandard = validTexts.map((text, idx) => ({
      text,
      sourceRefs: sec.standard[idx]?.sourceRefs || sec.sourceRefs,
    }));
    const ok = await applySectionMutation(
      sec,
      { standard: nextStandard },
      "Teks Standard berhasil diperbarui.",
    );
    if (ok) setEditingStandardSecId(null);
  }

  // 5. Edit Glosarium Istilah
  function startEditGlossary(sec: SectionDto) {
    setEditingGlossarySecId(sec.id);
    setGlossaryDrafts(sec.glossary.map((g) => ({ term: g.term, definition: g.definition })));
  }

  async function handleSaveGlossary(sec: SectionDto) {
    const validGlossary = glossaryDrafts
      .map((g) => ({ term: g.term.trim(), definition: g.definition.trim() }))
      .filter((g) => g.term.length > 0 && g.definition.length > 0);
    const nextGlossary = validGlossary.map((g, idx) => ({
      ...g,
      sourceRefs: sec.glossary[idx]?.sourceRefs || sec.sourceRefs,
    }));
    const ok = await applySectionMutation(
      sec,
      { glossary: nextGlossary },
      "Glosarium istilah berhasil diperbarui.",
    );
    if (ok) setEditingGlossarySecId(null);
  }

  const [activeIdx, setActiveIdx] = React.useState(0);
  const [cardIdxMap, setCardIdxMap] = React.useState<Record<string, number>>({});

  const total = sections.length;
  const sectionIdx = total ? Math.min(activeIdx, total - 1) : 0;
  const sec: SectionDto | undefined = sections[sectionIdx];
  const approvedCount = total - unapprovedSections.length;

  function goSection(next: number) {
    setActiveIdx(Math.max(0, Math.min(total - 1, next)));
  }

  const approval = sec ? approvals[sec.id] : undefined;
  const isApproved = !!(sec && approval && approval.sectionRevision === sec.revision);
  const currentTab = sec ? getSectionTab(sec.id) : "cards";
  const cardCount = sec ? sec.cards.length : 0;
  const cIdx = sec ? Math.min(cardIdxMap[sec.id] ?? 0, Math.max(cardCount - 1, 0)) : 0;
  const card: SectionCardDto | undefined = sec?.cards[cIdx];

  function goCard(next: number) {
    if (!sec) return;
    setCardIdxMap((prev) => ({
      ...prev,
      [sec.id]: Math.max(0, Math.min(cardCount - 1, next)),
    }));
  }

  const tabs = sec
    ? ([
        { id: "cards", label: "Kartu Fokus", count: sec.cards.length, icon: Sparkles },
        { id: "easy", label: "Easy Read", count: sec.easyRead.length, icon: BookOpen },
        { id: "standard", label: "Standard", count: sec.standard.length, icon: FileText },
        { id: "glossary", label: "Glosarium", count: sec.glossary.length, icon: HelpCircle },
      ] as const)
    : [];

  const sourceRefsForView =
    currentTab === "cards" && card && card.sourceRefs.length ? card.sourceRefs : sec?.sourceRefs ?? [];

  const fieldClass =
    "w-full rounded-btn border border-line bg-surface p-2 text-sm leading-relaxed text-ink focus:border-ink focus:outline-none";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {/* Subheader Navigasi & Info Draf */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/guru/kelas/${draft.classId}`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-btn border border-line bg-surface text-muted transition-colors hover:text-ink"
              aria-label="Kembali ke kelas"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-muted">
                  {draft.className} • {draft.materialSubject}
                </span>
                {draft.isPublished ? (
                  <span className="shrink-0 rounded bg-emerald-subtle px-1.5 py-0.5 text-[11px] font-semibold text-emerald">
                    Terbit
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-amber-subtle px-1.5 py-0.5 text-[11px] font-semibold text-amber">
                    Draf R{draft.revision}
                  </span>
                )}
              </div>
              <h1 className="max-w-xl truncate font-heading text-lg font-bold text-ink">
                {draft.materialTitle}
              </h1>
            </div>
          </div>

          {/* Action Bar Publikasi */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowSource((prev) => !prev)}
              className={`gap-2 ${showSource ? "font-semibold text-ink" : "text-muted"}`}
              title={showSource ? "Sembunyikan kolom sumber" : "Tampilkan kolom sumber"}
              aria-pressed={showSource}
            >
              <Columns2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{showSource ? "Sumber: Tampil" : "Sumber: Sembunyi"}</span>
            </Button>

            {!draft.isPublished && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleRegenerate}
                disabled={generating || publishing}
                className="gap-2"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{generating ? "Menyusun…" : "Susun Ulang AI"}</span>
              </Button>
            )}

            <DeleteMaterialModal
              materialId={draft.materialId}
              materialTitle={draft.materialTitle}
              csrfToken={csrfToken}
              redirectUrl={`/guru/kelas/${draft.classId}`}
            />

            {draft.isPublished ? (
              <>
                <Button variant="secondary" size="md" onClick={handleUnpublish} disabled={unpublishing}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>{unpublishing ? "Menarik…" : "Tarik Publikasi"}</span>
                </Button>
                <Button variant="primary" size="md" asChild>
                  <Link href={`/siswa/kelas/${draft.classId}/materi/${draft.materialId}`} target="_blank">
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Lihat Reader Siswa</span>
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                disabled={publishing || !allApproved || generating}
                className="gap-2"
                title={allApproved ? undefined : "Setujui semua bagian terlebih dahulu"}
              >
                <Send className="size-4" aria-hidden="true" />
                <span>{publishing ? "Menerbitkan…" : "Terbitkan"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="konten-utama" className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8">


        {/* Navigasi bagian (carousel) + progres persetujuan */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goSection(sectionIdx - 1)}
            disabled={sectionIdx === 0}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-primary hover:border-primary/40 disabled:opacity-40 cursor-pointer"
            aria-label="Bagian sebelumnya"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          <nav aria-label="Daftar bagian materi" className="flex flex-1 items-center gap-2 overflow-x-auto py-1">
            {sections.map((s, i) => {
              const ap = approvals[s.id];
              const ok = !!ap && ap.sectionRevision === s.revision;
              const active = i === sectionIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goSection(i)}
                  aria-current={active ? "step" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    active
                      ? "border-primary bg-primary text-white shadow-xs font-semibold"
                      : ok
                        ? "border-emerald/40 bg-surface text-ink hover:border-emerald font-medium"
                        : "border-line bg-surface text-muted hover:text-primary hover:border-primary/40 font-medium"
                  }`}
                >
                  {ok ? (
                    <Check className={`size-3.5 ${active ? "text-white" : "text-emerald"}`} aria-label="Disetujui" />
                  ) : (
                    <span className={`size-1.5 rounded-full ${active ? "bg-white" : "bg-amber"}`} aria-label="Perlu persetujuan" />
                  )}
                  Bagian {i + 1}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => goSection(sectionIdx + 1)}
            disabled={sectionIdx >= total - 1}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-primary hover:border-primary/40 disabled:opacity-40 cursor-pointer"
            aria-label="Bagian berikutnya"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-emerald transition-all duration-500"
              style={{ width: `${total ? (approvedCount / total) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-muted">
            {approvedCount} dari {total} disetujui
          </span>
        </div>

        {/* Satu bagian per layar */}
        {sec ? (
          <section
            key={sec.id}
            className="slide-in mt-5 overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_2px_4px_rgba(19,23,21,0.04),0_24px_48px_-28px_rgba(19,23,21,0.22)]"
          >
            {/* Header bagian */}
            <div className="flex flex-col justify-between gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">
                  Bagian {sectionIdx + 1} dari {total}
                  <span className="ml-2 font-mono font-normal text-muted">R{sec.revision}</span>
                </p>

                {editingSectionId === sec.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="min-w-0 rounded-btn border border-line bg-surface px-2.5 py-1 text-base font-bold text-ink focus:border-ink focus:outline-none"
                    />
                    <Button size="sm" variant="primary" onClick={() => handleSaveSectionEdit(sec)}>
                      Simpan
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingSectionId(null)}>
                      Batal
                    </Button>
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-2">
                    <h2 className="truncate font-heading text-xl font-bold tracking-tight text-ink">{sec.title}</h2>
                    <button
                      type="button"
                      onClick={() => startEditSection(sec)}
                      className="shrink-0 rounded p-1 text-muted transition-colors hover:text-ink"
                      title="Edit judul bagian"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {isApproved && approval ? (
                  <div className="inline-flex items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1 rounded-btn bg-emerald-subtle px-2.5 py-1.5 font-semibold text-emerald">
                      <Check className="size-3.5" aria-hidden="true" />
                      Disetujui
                    </span>
                    <span>{formatDate(approval.reviewedAt)}</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleApproveSection(sec)}
                    disabled={approvingId === sec.id}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    <span>{approvingId === sec.id ? "Menyimpan…" : "Setujui bagian ini"}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Pilihan format adaptasi */}
            <div className="border-b border-line px-5 py-3 sm:px-6">
              <div
                role="tablist"
                aria-label="Format adaptasi"
                className="inline-flex max-w-full gap-1 overflow-x-auto rounded-[10px] bg-surface-subtle p-1"
              >
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = currentTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSectionTab(sec.id, t.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active ? "bg-surface text-ink shadow-xs" : "text-muted hover:text-ink"
                      }`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span>{t.label}</span>
                      <span className="font-mono text-[11px] font-normal text-muted">{t.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sumber | Adaptasi berdampingan (Dual View) */}
            <div className={cn("dual-view-grid w-full", showSource && "split")}>
              {showSource && (
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted">
                      Sumber ({source.inputType.toUpperCase()} · Revisi {source.revisionNumber})
                    </p>
                    {sourceConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald">
                        <Check className="size-3" aria-hidden="true" />
                        Terkonfirmasi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConfirmSource}
                        disabled={confirmingSource}
                        className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {confirmingSource ? "Menyimpan…" : "Konfirmasi sumber"}
                      </button>
                    )}
                  </div>
                  <div className="mt-3">
                    <SourceBlocks
                      blocks={source.blocks}
                      refs={sourceRefsForView}
                      highlightText={currentTab === "cards" && card ? card.originalText : undefined}
                    />
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-emerald">
                    Adaptasi · {tabs.find((t) => t.id === currentTab)?.label}
                  </p>

                  {currentTab === "easy" && editingEasyReadSecId !== sec.id && (
                    <button
                      type="button"
                      onClick={() => startEditEasyRead(sec)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  )}
                  {currentTab === "standard" && editingStandardSecId !== sec.id && (
                    <button
                      type="button"
                      onClick={() => startEditStandard(sec)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  )}
                  {currentTab === "glossary" && editingGlossarySecId !== sec.id && (
                    <button
                      type="button"
                      onClick={() => startEditGlossary(sec)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                      Kelola
                    </button>
                  )}
                  {currentTab === "cards" && card && editingCard?.cardId !== card.id && (
                    <button
                      type="button"
                      onClick={() => startEditCard(sec.id, card)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                      Edit kartu
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  {/* 1. KARTU FOKUS: satu kartu per layar */}
                  {currentTab === "cards" &&
                    (card ? (
                      editingCard?.cardId === card.id ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-muted">Judul kartu</label>
                            <input
                              type="text"
                              value={editingCard.title}
                              onChange={(e) =>
                                setEditingCard((prev) => (prev ? { ...prev, title: e.target.value } : null))
                              }
                              className={`${fieldClass} font-bold`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-muted">Isi kartu fokus</label>
                            <textarea
                              value={editingCard.easyText}
                              onChange={(e) =>
                                setEditingCard((prev) => (prev ? { ...prev, easyText: e.target.value } : null))
                              }
                              rows={4}
                              className={fieldClass}
                              placeholder="Tuliskan isi kartu fokus pembelajaran..."
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button size="sm" variant="primary" onClick={() => handleSaveCard(sec)} disabled={savingEdit}>
                              {savingEdit ? "Menyimpan…" : "Simpan kartu"}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingCard(null)}>
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                              {card.kind === "recap" ? "Ringkasan kunci" : `Kartu ${cIdx + 1}`}
                            </span>
                            <span className="rounded bg-surface-subtle border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted">
                              {card.kind === "recap" ? "Ringkasan" : "Konsep"}
                            </span>
                          </div>
                          <h3 className="font-heading text-lg font-bold text-ink leading-snug">{card.title}</h3>
                          <div className="rounded-xl border border-line bg-surface p-4 text-sm leading-[1.75] text-ink shadow-xs">
                            <p className="font-sans leading-relaxed text-ink/90">
                              {card.easyText || card.originalText}
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-muted">Belum ada kartu fokus pada bagian ini.</p>
                    ))}

                  {/* 2. TEKS EASY READ */}
                  {currentTab === "easy" &&
                    (editingEasyReadSecId === sec.id ? (
                      <div className="space-y-3">
                        <div className="max-h-[46vh] space-y-2.5 overflow-y-auto pr-1">
                          {easyReadDrafts.map((text, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="mt-2 font-mono text-xs font-semibold text-muted">{idx + 1}.</span>
                              <textarea
                                value={text}
                                onChange={(e) => {
                                  const next = [...easyReadDrafts];
                                  next[idx] = e.target.value;
                                  setEasyReadDrafts(next);
                                }}
                                rows={2}
                                className={`flex-1 ${fieldClass}`}
                              />
                              <button
                                type="button"
                                onClick={() => setEasyReadDrafts(easyReadDrafts.filter((_, i) => i !== idx))}
                                className="mt-2 rounded p-1 text-muted hover:text-rose-600"
                                title="Hapus butir kalimat ini"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEasyReadDrafts([...easyReadDrafts, ""])}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Tambah butir kalimat
                        </button>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveEasyRead(sec)} disabled={savingEdit}>
                            {savingEdit ? "Menyimpan…" : "Simpan"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingEasyReadSecId(null)}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ul className="max-h-[46vh] space-y-3 overflow-y-auto pr-2 text-sm leading-[1.75] text-ink">
                        {sec.easyRead.map((er, erIdx) => (
                          <li key={erIdx} className="flex items-start gap-2.5">
                            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden="true" />
                            <span>{er.text}</span>
                          </li>
                        ))}
                      </ul>
                    ))}

                  {/* 3. TEKS STANDARD */}
                  {currentTab === "standard" &&
                    (editingStandardSecId === sec.id ? (
                      <div className="space-y-3">
                        <div className="max-h-[46vh] space-y-2.5 overflow-y-auto pr-1">
                          {standardDrafts.map((text, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="mt-2 font-mono text-xs font-semibold text-muted">§{idx + 1}</span>
                              <textarea
                                value={text}
                                onChange={(e) => {
                                  const next = [...standardDrafts];
                                  next[idx] = e.target.value;
                                  setStandardDrafts(next);
                                }}
                                rows={3}
                                className={`flex-1 ${fieldClass}`}
                              />
                              <button
                                type="button"
                                onClick={() => setStandardDrafts(standardDrafts.filter((_, i) => i !== idx))}
                                className="mt-2 rounded p-1 text-muted hover:text-rose-600"
                                title="Hapus paragraf ini"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setStandardDrafts([...standardDrafts, ""])}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Tambah paragraf
                        </button>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveStandard(sec)} disabled={savingEdit}>
                            {savingEdit ? "Menyimpan…" : "Simpan"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingStandardSecId(null)}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-2 text-sm leading-[1.75] text-ink">
                        {sec.standard.map((std, sIdx) => (
                          <p key={sIdx}>{std.text}</p>
                        ))}
                      </div>
                    ))}

                  {/* 4. GLOSARIUM */}
                  {currentTab === "glossary" &&
                    (editingGlossarySecId === sec.id ? (
                      <div className="space-y-3">
                        <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
                          {glossaryDrafts.map((glo, gIdx) => (
                            <div key={gIdx} className="space-y-2 rounded-btn border border-line p-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-muted">Istilah</label>
                                <button
                                  type="button"
                                  onClick={() => setGlossaryDrafts(glossaryDrafts.filter((_, i) => i !== gIdx))}
                                  className="rounded p-0.5 text-muted hover:text-rose-600"
                                  title="Hapus istilah ini"
                                >
                                  <Trash2 className="size-3.5" aria-hidden="true" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={glo.term}
                                onChange={(e) => {
                                  const next = [...glossaryDrafts];
                                  next[gIdx] = { ...next[gIdx], term: e.target.value };
                                  setGlossaryDrafts(next);
                                }}
                                className={`${fieldClass} font-bold`}
                              />
                              <label className="block text-[11px] font-semibold text-muted">Definisi</label>
                              <textarea
                                value={glo.definition}
                                onChange={(e) => {
                                  const next = [...glossaryDrafts];
                                  next[gIdx] = { ...next[gIdx], definition: e.target.value };
                                  setGlossaryDrafts(next);
                                }}
                                rows={2}
                                className={fieldClass}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setGlossaryDrafts([...glossaryDrafts, { term: "", definition: "" }])}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Tambah istilah
                        </button>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveGlossary(sec)} disabled={savingEdit}>
                            {savingEdit ? "Menyimpan…" : "Simpan"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingGlossarySecId(null)}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <dl className="max-h-[46vh] space-y-3 overflow-y-auto pr-2">
                        {sec.glossary.map((glo, gIdx) => (
                          <div key={gIdx}>
                            <dt className="text-sm font-bold text-ink">{glo.term}</dt>
                            <dd className="mt-0.5 text-sm leading-relaxed text-ink/80">{glo.definition}</dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                </div>

                {/* Kontrol carousel kartu */}
                {currentTab === "cards" && cardCount > 1 && (
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => goCard(cIdx - 1)}
                      disabled={cIdx === 0}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink disabled:opacity-40"
                      aria-label="Kartu sebelumnya"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-1.5" role="group" aria-label="Pilih kartu">
                      {sec.cards.map((c, i) => (
                        <button
                          key={c.id || i}
                          type="button"
                          onClick={() => goCard(i)}
                          aria-label={`Kartu ${i + 1}`}
                          aria-current={i === cIdx ? "true" : undefined}
                          className={`h-1.5 rounded-full transition-all ${
                            i === cIdx ? "w-6 bg-ink" : "w-1.5 bg-line"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => goCard(cIdx + 1)}
                      disabled={cIdx >= cardCount - 1}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink disabled:opacity-40"
                      aria-label="Kartu berikutnya"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigasi antar bagian */}
            <div className="flex items-center justify-between border-t border-line bg-surface-subtle/60 px-5 py-3 sm:px-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goSection(sectionIdx - 1)}
                disabled={sectionIdx === 0}
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Sebelumnya
              </Button>
              <span className="text-xs text-muted">
                {sectionIdx + 1} / {total}
              </span>
              {sectionIdx < total - 1 ? (
                <Button variant="ghost" size="sm" onClick={() => goSection(sectionIdx + 1)} className="gap-1">
                  Berikutnya
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <span className="text-xs font-semibold text-muted">
                  {allApproved ? "Siap diterbitkan" : `${unapprovedSections.length} bagian belum disetujui`}
                </span>
              )}
            </div>
          </section>
        ) : (
          <div className="mt-5 rounded-[16px] border border-line bg-surface p-10 text-center text-sm text-muted">
            Draf ini belum memiliki bagian. Gunakan “Susun Ulang AI” untuk membuat adaptasi.
          </div>
        )}
        {/* Modal Indikator Proses AI saat Susun Ulang */}
        <AiProcessingModal
          open={generating}
          materialTitle={draft.materialTitle}
          mode="regenerate"
        />
      </main>
    </div>
  );
}

function getHighlightRanges(
  fullText: string,
  target?: string,
): { start: number; end: number }[] {
  if (!target || !target.trim()) return [];

  const cleanTarget = target.trim();

  // 1. Pencarian kecocokan persis (exact match)
  const exactIdx = fullText.indexOf(cleanTarget);
  if (exactIdx !== -1) {
    return [{ start: exactIdx, end: exactIdx + cleanTarget.length }];
  }

  // 2. Pencarian fleksibel spasi/whitespace
  try {
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = escaped.replace(/\s+/g, "\\s+");
    const regex = new RegExp(regexPattern, "i");
    const match = regex.exec(fullText);
    if (match && match.index !== undefined) {
      return [{ start: match.index, end: match.index + match[0].length }];
    }
  } catch {
    // fallback jika regex gagal
  }

  // 3. Pencarian berbasis kalimat jika target teks panjang/gabungan klausa
  const sentences = cleanTarget
    .split(/(?<=[.!?])\s+|\s*;\s*dan\s+|\s*;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  const ranges: { start: number; end: number }[] = [];

  for (const sentence of sentences) {
    try {
      const escaped = sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const regex = new RegExp(escaped, "i");
      const match = regex.exec(fullText);
      if (match && match.index !== undefined) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
      }
    } catch {
      // ignore
    }
  }

  if (ranges.length > 0) {
    ranges.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      const cur = ranges[i];
      if (cur.start <= last.end + 5) {
        last.end = Math.max(last.end, cur.end);
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }

  return [];
}

function HighlightedSourceText({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) {
  const ranges = React.useMemo(() => getHighlightRanges(text, highlight), [text, highlight]);

  if (!ranges.length) {
    return <span>{text}</span>;
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, idx) => {
    if (range.start > lastIndex) {
      nodes.push(text.slice(lastIndex, range.start));
    }
    nodes.push(
      <mark
        key={idx}
        className="rounded bg-emerald-subtle px-1.5 py-0.5 font-medium text-ink border border-emerald-border/80 shadow-xs"
        title="Bagian teks sumber yang diadaptasikan menjadi kartu fokus ini"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span>{nodes}</span>;
}

function SourceBlocks({
  blocks,
  refs,
  highlightText,
}: {
  blocks: SourceRevisionDetailDto["blocks"];
  refs: string[];
  highlightText?: string;
}) {
  const picked = refs.length ? blocks.filter((b) => refs.includes(b.id)) : blocks;
  return (
    <div className="max-h-[46vh] space-y-4 overflow-y-auto pr-2">
      {picked.map((b) => (
        <div key={b.id}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] text-muted">
              Blok #{b.ordinal + 1}
              {b.pageNumber ? ` · Hlm ${b.pageNumber}` : ""}
            </p>
            {highlightText ? (
              <span className="text-[10px] font-semibold text-emerald">
                Teks rujukan aktif disorot
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-[1.75] text-ink/85">
            <HighlightedSourceText text={b.text} highlight={highlightText} />
          </p>
        </div>
      ))}
    </div>
  );
}
