import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { ModuleCard, type Module } from "@/components/ModuleCard";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Admin,
  head: () => ({
    meta: [
      { title: "Today Focus — Admin" },
      { name: "description", content: "Today Focus dashboard with sequential chapter unlocks." },
    ],
  }),
});

function Admin() {
  const [isChapter5Done, setIsChapter5Done] = useState(false);

  const modules: Module[] = useMemo(
    () => [
      {
        id: "ch5",
        code: "TAX3761",
        chapter: "Chapter 5",
        title: "Capital Gains Tax",
        description: "Disposal events, base cost, exclusions and inclusion rates.",
        progress: isChapter5Done ? 100 : 60,
        locked: false,
        done: isChapter5Done,
      },
      {
        id: "ch6",
        code: "TAX3761",
        chapter: "Chapter 6",
        title: "Trusts & Estate Duty",
        description: "Conduit principle, attribution rules and estate duty computation.",
        progress: 0,
        locked: !isChapter5Done,
        unlockHint: "Finish Chapter 5",
      },
    ],
    [isChapter5Done]
  );

  const handleComplete = (id: string) => {
    if (id === "ch5") {
      setIsChapter5Done(true);
      toast.success("Chapter 6 Unlocked! 🚀", {
        description: "Vibrant mode activated. Keep the streak going.",
      });
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-vibrant-from" /> 7-day streak
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-vibrant">Today Focus</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Two chapters queued. Finish what's lit — the next one unlocks the moment you do.
          </p>
        </div>
      </div>

      <div
        className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
          isChapter5Done
            ? "border-transparent bg-vibrant/10 text-foreground"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        <Sparkles className={`h-4 w-4 ${isChapter5Done ? "text-vibrant-from" : "text-muted-foreground"}`} />
        {isChapter5Done ? (
          <span>
            <span className="font-medium text-foreground">Chapter 6 Unlocked! 🚀</span> Vibrant mode is on.
          </span>
        ) : (
          <span>
            <span className="font-medium text-foreground">Complete Ch 5</span> to unlock Chapter 6.
          </span>
        )}
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Modules</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <ModuleCard key={m.id} module={m} onComplete={handleComplete} />
          ))}
        </div>
        {isChapter5Done && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsChapter5Done(false)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Reset demo
            </button>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
