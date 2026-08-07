"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadCloud, FileSpreadsheet, X, Loader2 } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  onFileChange: (file: File | null) => void;
  file?: File | null;
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileUploader({
  accept = ".xlsx,.xls,.csv",
  maxSizeMB = 10,
  onFileChange,
  file,
  disabled,
  uploading,
  uploadProgress = 0,
  error,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `File exceeds the ${maxSizeMB}MB limit`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    const validationError = validate(selected);
    if (validationError) {
      setInternalError(validationError);
      onFileChange(null);
      return;
    }
    setInternalError(null);
    onFileChange(selected);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
          }}
          disabled={disabled || uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
            (disabled || uploading) && "cursor-not-allowed opacity-60"
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Drag &amp; drop your file here, or{" "}
              <span className="text-primary">browse files</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: {accept.split(",").join(", ").toUpperCase()} &middot; Max{" "}
              {maxSizeMB}MB
            </p>
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onFileChange(null)}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {uploading && file && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading {file.name}...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && internalError && <p className="text-xs text-destructive">{internalError}</p>}
    </div>
  );
}
