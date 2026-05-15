import { Lock, FileText, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Module {
  id: string;
  code: string;
  chapter: string;
  title: string;
  description: string;
  progress: number;
  locked: boolean;
  done?: boolean;
  unlockHint?: string;
}

interface Props {
  module: Module;
  onComplete?: (id: string) => void;
}

export function ModuleCard({ module, onComplete }: Props) {
  const { locked, done } = module;
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
              {module.code}
            </p>
            <h3 className={cn("text-lg font-semibold", locked && "text-locked-foreground")}>
              {module.chapter}
            </h3>
          </div>
        </div>
        {done && (
          <span className="inline-flex items-center gap-1 rounded-full bg-vibrant/10 px-2.5 py-1 text-xs font-medium text-vibrant">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
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
        <Button
          disabled={locked}
          variant={locked ? "secondary" : "default"}
          className={cn(
            "flex-1",
            !locked && "bg-vibrant text-primary-foreground hover:opacity-90 border-0 shadow-vibrant"
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          {locked ? `Locked: ${module.unlockHint ?? "Complete previous"}` : "File Links"}
        </Button>
        {!locked && !done && onComplete && (
          <Button variant="outline" size="icon" onClick={() => onComplete(module.id)} title="Mark complete">
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
