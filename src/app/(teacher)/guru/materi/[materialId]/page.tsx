import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { getMaterialDraft } from "@/server/services/drafts.service";
import { getMaterialSource } from "@/server/services/materials.service";
import { TeacherDraftReviewClient } from "./draft-review-client";

export const metadata = {
  title: "Tinjau & Setujui Draf Materi — AksesKelas",
};

interface PageProps {
  params: Promise<{ materialId: string }>;
}

export default async function TeacherDraftReviewPage({ params }: PageProps) {
  const session = await requireRole("teacher");
  const { materialId } = await params;

  let draft;
  let source;
  try {
    draft = await getMaterialDraft(session.user, materialId);
    source = await getMaterialSource(session.user, materialId);
  } catch {
    notFound();
  }

  return (
    <TeacherDraftReviewClient
      draft={draft}
      source={source}
      csrfToken={session.csrfToken}
    />
  );
}
