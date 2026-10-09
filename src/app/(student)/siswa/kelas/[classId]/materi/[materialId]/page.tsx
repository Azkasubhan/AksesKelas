import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { getPublishedLesson } from "@/server/services/drafts.service";
import { StudentReaderClient } from "./student-reader-client";

interface PageProps {
  params: Promise<{ classId: string; materialId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { materialId } = await params;
  return {
    title: `Membaca Materi — AksesKelas`,
  };
}

export default async function StudentReaderPage({ params }: PageProps) {
  const session = await requireRole("student");
  const { classId, materialId } = await params;

  let lesson;
  try {
    lesson = await getPublishedLesson(session.user, materialId);
  } catch {
    notFound();
  }

  return <StudentReaderClient lesson={lesson} classId={classId} />;
}
