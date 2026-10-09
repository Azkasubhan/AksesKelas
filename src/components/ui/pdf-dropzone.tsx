"use client";

import * as React from "react";
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePdfFile, MAX_PDF_SIZE_BYTES } from "@/shared/schemas/files";

export interface PdfDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  disabled?: boolean;
  className?: string;
  errorMessage?: string;
}

export function PdfDropzone({
  onFileSelect,
  selectedFile,
  disabled = false,
  className,
  errorMessage,
}: PdfDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayError = errorMessage || internalError;

  function handleFile(file: File | undefined) {
    if (!file) return;

    setInternalError(null);
    const validation = validatePdfFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      setInternalError(validation.error || "Berkas tidak valid");
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        id="pdf-file-input"
        aria-describedby={displayError ? "pdf-error-msg" : undefined}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-surface border-2 border-dashed p-7 text-center transition-all duration-200 cursor-pointer select-none",
          isDragOver
            ? "border-primary bg-primary-subtle/50 scale-[1.01]"
            : "border-control hover:border-primary/60 bg-surface hover:bg-surface-subtle/40",
          displayError && "border-danger bg-danger-bg/20",
          disabled && "opacity-60 cursor-not-allowed hover:border-control hover:bg-surface",
        )}
      >
        {selectedFile ? (
          <div className="flex w-full items-center justify-between gap-4 p-2">
            <div className="flex items-center gap-3.5 text-left overflow-hidden">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-btn bg-emerald-subtle text-emerald">
                <FileText className="size-6" aria-hidden="true" />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-ink">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted">{formatSize(selectedFile.size)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Berkas PDF valid
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-inset hover:text-danger focus-visible:outline-focus"
              aria-label="Hapus berkas terpilih"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full transition-colors",
                isDragOver ? "bg-primary text-white" : "bg-surface-subtle text-muted",
              )}
            >
              <UploadCloud className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Tarik & letakkan berkas PDF di sini, atau{" "}
                <span className="text-primary underline underline-offset-2">pilih dari perangkat</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                Hanya berkas dokumen PDF (.pdf). Maksimal ukuran {MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.
              </p>
            </div>
          </div>
        )}
      </div>

      {displayError ? (
        <div
          id="pdf-error-msg"
          role="alert"
          className="flex items-start gap-2 rounded-btn bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      ) : null}
    </div>
  );
}
