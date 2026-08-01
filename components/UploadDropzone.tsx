"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onComplete: (pageDataUrls: string[]) => void;
  onReset?: () => void;
}

type Status = "idle" | "reading" | "rendering" | "done" | "error";

export default function UploadDropzone({ onComplete, onReset }: UploadDropzoneProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [pageProgress, setPageProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setStatus("error");
        setErrorMessage("That doesn't look like a PDF. Please choose a .pdf file.");
        return;
      }

      setFileName(file.name);
      setStatus("reading");
      setErrorMessage("");

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        setStatus("rendering");
        setPageProgress({ current: 0, total: pdf.numPages });

        const pages: string[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas not supported");
          await page.render({ canvasContext: context, viewport }).promise;
          pages.push(canvas.toDataURL("image/png"));
          setPageProgress({ current: pageNum, total: pdf.numPages });
        }

        setStatus("done");
        onComplete(pages);
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMessage("We couldn't read that PDF. Try a different file.");
      }
    },
    [onComplete]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleClear = () => {
    setStatus("idle");
    setFileName("");
    setPageProgress({ current: 0, total: 0 });
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
    onReset?.();
  };

  if (status === "done") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent-soft-strong bg-accent-soft px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText className="text-accent" size={20} />
          <div>
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="font-mono text-xs text-ink-muted">
              {pageProgress.total} slide{pageProgress.total === 1 ? "" : "s"} rendered
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="tap-target flex items-center justify-center rounded-full text-ink-muted hover:bg-white hover:text-ink"
          aria-label="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragActive
            ? "border-accent bg-accent-soft"
            : "border-line-strong bg-surface hover:border-accent-soft-strong"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        <UploadCloud className="text-accent" size={28} />
        {status === "idle" && (
          <>
            <p className="text-sm font-medium text-ink">
              Drag your slides here, or click to browse
            </p>
            <p className="text-xs text-ink-muted">PDF only, rendered right in your browser</p>
          </>
        )}
        {status === "reading" && (
          <p className="text-sm font-medium text-ink">Reading {fileName}…</p>
        )}
        {status === "rendering" && (
          <div className="w-full max-w-xs">
            <p className="mb-2 text-sm font-medium text-ink">
              Rendering slide {pageProgress.current} of {pageProgress.total}…
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surfacemuted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{
                  width: `${(pageProgress.current / Math.max(1, pageProgress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm text-heat-red">{errorMessage}</p>
      )}
    </div>
  );
}
