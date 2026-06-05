import { useRef, useState } from "react";
import { Lock, FileText, CheckCircle2, Sparkles, ArrowRight, Paperclip, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getChapterFileUrl, type ChapterAttachment } from "@/lib/study.functions";

export interface Module {
  id: string;
  code: string;
  subjectName?: string;
  chapter: string;
  title: string;
  description: string;
  progress: number;
  locked: boolean;
  done?: boolean;
  unlockHint?: string;
  attachments?: ChapterAttachment[];
}

interface Props {
  module: Module;
  onComplete?: (id: string) => void;
  onUploadFile?: (id: string, file: File) => Promise<void>;
  onRemoveFile?: (id: string, path: string) => Promise<void>;
}

const fmtSize = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

export function ModuleCard({ module, onComplete, onUploadFile, onRemoveFile }: Props) {
  const { locked, done } = module;
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const attachments = module.attachments ?? [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || !onUploadFile) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        await onUploadFile(module.id, f);
      }
    } catch (e: any) {
      alert("Upload failed: " + (e?.message ?? e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openAttachment = async (attachment: ChapterAttachment) => {
    try {
      const url = await getChapterFileUrl(attachment);
      window.open(url, "_blank");
    } catch (e: any) {
      alert("Could not open file: " + (e?.message ?? e));
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-5 transition-all duration-300",
        locked
          ? "border-border bg-locked/40 grayscale"
          : "border-border bg-card shadow-card hover:shadow-vibrant hover:-translate-y-0.5"
      )}
    >
      {!locked && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-vibrant opacity-20 blur-3xl" />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              locked ? "bg-locked text-locked-foreground" : "bg-vibrant text-primary-foreground shadow-vibrant"
            )}
          >
            {locked ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-wider", locked ? "text-locked-foreground" : "text-muted-foreground")}>
              {module.code}{module.subjectName ? <span className="ml-1 normal-case tracking-normal text-foreground/70">· {module.subjectName}</span> : null}
            </p>
            <h3 className={cn("text-lg font-semibold", locked && "text-locked-foreground")}>
              {module.chapter}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-vibrant/10 px-2 py-0.5 text-[11px] font-medium text-vibrant">
              <Paperclip className="h-3 w-3" /> {attachments.length}
            </span>
          )}
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-vibrant/10 px-2.5 py-1 text-xs font-medium text-vibrant">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
        </div>
      </div>

      <h4 className={cn("relative mt-4 text-base font-medium", locked && "text-locked-foreground")}>
        {module.title}
      </h4>
      <p className={cn("relative mt-1 text-sm", locked ? "text-locked-foreground" : "text-muted-foreground")}>
        {module.description}
      </p>

      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className={locked ? "text-locked-foreground" : "text-muted-foreground"}>Progress</span>
          <span className={cn("font-medium", locked ? "text-locked-foreground" : "text-foreground")}>
            {module.progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-700", locked ? "bg-locked-foreground/40" : "bg-vibrant")}
            style={{ width: `${module.progress}%` }}
          />
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          disabled={locked}
          variant={locked ? "secondary" : "default"}
          onClick={() => !locked && setOpen(true)}
          className={cn(
            "flex-1",
            !locked && "bg-vibrant text-primary-foreground hover:opacity-90 border-0 shadow-vibrant"
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          {locked ? `Locked: ${module.unlockHint ?? "Complete previous"}` : "File Links"}
        </Button>
        {!locked && onUploadFile && (
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Attach files"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Attach files"}
          </Button>
        )}
        {!locked && !done && onComplete && (
          <Button variant="outline" size="icon" onClick={() => onComplete(module.id)} title="Mark complete">
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{module.chapter} — {module.title}</DialogTitle>
            <DialogDescription>Attach files or links for this chapter. Only you can see them.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {attachments.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No files yet. Upload your first one below.
              </p>
            ) : (
              <ul className="space-y-1">
                {attachments.map((a) => (
                  <li
                    key={a.path}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm"
                  >
                    <button
                      onClick={() => openAttachment(a)}
                      className="inline-flex min-w-0 flex-1 items-center gap-2 truncate text-left hover:text-vibrant"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">({fmtSize(a.size)})</span>
                    </button>
                    {onRemoveFile && (
                      <button
                        onClick={() => onRemoveFile(module.id, a.path)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                <X className="mr-1 h-4 w-4" /> Close
              </Button>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !onUploadFile}
                className="bg-vibrant text-primary-foreground border-0 shadow-vibrant hover:opacity-90"
              >
                <Paperclip className="mr-1 h-4 w-4" />
                {uploading ? "Uploading…" : "Attach files"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
