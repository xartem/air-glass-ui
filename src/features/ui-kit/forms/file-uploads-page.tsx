import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

type PickedFile = { name: string; size: number };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * File uploads showcase (W5): a drag-and-drop dropzone with a drag-over accent
 * and a click-to-browse fallback. Static demo — it only reads the picked files'
 * names/sizes into state; nothing is read, uploaded or sent anywhere.
 */
export function FileUploadsPage() {
  useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).map((file) => ({
      name: file.name,
      size: file.size,
    }));
    setFiles((current) => [...current, ...picked]);
  };

  const removeAt = (index: number) =>
    setFiles((current) => current.filter((_, i) => i !== index));

  return (
    <ShowcasePage
      title={t("showcase.forms.fileUploads.title")}
      description={t("showcase.forms.fileUploads.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.dropzone")}
        previewClassName="block"
        notes={t("showcase.forms.fileUploads.note")}
        code={`const [files, setFiles] = useState<File[]>([]);

<div
  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
  className={cn("rounded-xl border-2 border-dashed", dragging && "border-primary bg-accent")}
>
  <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
</div>`}
      >
        <div className="w-full max-w-xl space-y-4">
          <div
            role="button"
            tabIndex={0}
            aria-label={t("showcase.forms.fileUploads.hint")}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-10 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              dragging && "border-primary bg-accent text-accent-foreground",
            )}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {t("showcase.forms.fileUploads.hint")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("showcase.forms.fileUploads.limits")}
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("showcase.forms.fileUploads.selected")}
            </p>
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("showcase.forms.fileUploads.empty")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2.5 rounded-lg border border-[var(--glass-border)] px-3 py-2 text-sm"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatSize(file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("common.delete")}
                      onClick={() => removeAt(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
