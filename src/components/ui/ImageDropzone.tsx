"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { IMAGE_MIME_TYPES } from "@/lib/fileValidation";
import { cn } from "@/lib/cn";

interface ImageDropzoneProps {
  id: string;
  label: string;
  /** The already-stored image, shown until a new file is picked. */
  existingUrl: string | null;
  /** The freshly picked file, previewed ahead of any upload. */
  file: File | null;
  /** Receives both picker choices and drops; the caller validates. */
  onPick: (file: File | null) => void;
  onRemove: () => void;
  error?: string | null;
  disabled?: boolean;
  hint?: string;
}

/**
 * Picks one image, by drag-and-drop or through the file picker, and
 * previews it before anything is uploaded.
 *
 * The preview comes from an object URL over the local File, which is why
 * the user sees their image immediately rather than after a save round
 * trip. That URL is revoked when it is replaced or the field unmounts —
 * without that, every re-pick would leak a blob for the life of the page.
 *
 * Validation deliberately lives with the caller: the same rules have to
 * cover the picker, the drop and the submit, so keeping them in one place
 * upstream beats duplicating them here.
 */
export function ImageDropzone({
  id,
  label,
  existingUrl,
  file,
  onPick,
  onRemove,
  error,
  disabled,
  hint,
}: ImageDropzoneProps) {
  const { t } = useTranslations();
  const [dragging, setDragging] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displaySrc = previewUrl ?? existingUrl;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-(--color-text)">{label}</span>

      <label
        htmlFor={id}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          onPick(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-(--radius-lg) border border-dashed p-4 text-center transition-colors",
          dragging
            ? "border-(--color-gold) bg-(--color-gold-tint)"
            : "border-(--color-border-strong) bg-(--color-bg-elevated) hover:border-(--color-gold)/50",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {displaySrc ? (
          // object-contain, never cover: category artwork is typically a
          // transparent PNG whose subject must not be cropped.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt="" className="max-h-40 w-full object-contain" />
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-surface) text-(--color-gold-dark)">
              <ImagePlus className="h-5 w-5" aria-hidden="true" strokeWidth={1.6} />
            </span>
            <span className="text-sm font-medium text-(--color-text)">{hint ?? t("admin.categoryImageHint")}</span>
            <span className="text-xs text-(--color-text-faint)">{t("admin.categoryImageChoose")}</span>
          </>
        )}

        <input
          id={id}
          name="image"
          type="file"
          accept={IMAGE_MIME_TYPES.join(",")}
          disabled={disabled}
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            // Cleared so re-picking the same filename still fires change.
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {displaySrc && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => document.getElementById(id)?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {t("admin.replaceImageAction")}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t("admin.removeImageAction")}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-(--color-danger)">
          {error}
        </p>
      )}
    </div>
  );
}
