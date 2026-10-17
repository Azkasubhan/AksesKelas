"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

interface DeleteClassModalProps {
  classId: string;
  className: string;
  csrfToken: string;
  studentCount?: number;
  materialCount?: number;
  trigger?: React.ReactNode;
}

export function DeleteClassModal({
  classId,
  className,
  csrfToken,
  trigger,
}: DeleteClassModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setIsDeleting(false);
    }
  }, [open]);

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await apiFetch(`/classes/${classId}`, {
        method: "DELETE",
        csrfToken,
      });

      toast.success(`Kelas "${className}" berhasil dihapus.`);
      setOpen(false);
      router.push("/guru");
      router.refresh();
    } catch (err) {
      setIsDeleting(false);
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Gagal menghapus kelas. Silakan coba lagi.");
      } else {
        setErrorMsg("Terjadi gangguan jaringan saat menghapus kelas.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="secondary"
            size="md"
            className="gap-2 border-danger/30 text-danger hover:bg-danger/10 hover:border-danger hover:text-danger active:bg-danger/20 font-semibold"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>Hapus Kelas</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        title="Hapus Kelas?"
        description="Konfirmasi penghapusan kelas."
        className="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-ink leading-relaxed">
            Apakah Anda yakin ingin menghapus kelas <strong className="font-semibold text-ink">"{className}"</strong>? Seluruh murid dan materi di dalamnya akan terhapus.
          </p>

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              variant="secondary"
              size="md"
              disabled={isDeleting}
              onClick={() => setOpen(false)}
              className="cursor-pointer font-medium"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={isDeleting}
              onClick={handleDelete}
              className="gap-2 cursor-pointer font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  <span>Hapus Kelas</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
