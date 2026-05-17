import { createFileRoute } from "@tanstack/react-router";
import { Flame, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { ModuleCard, type Module } from "@/components/ModuleCard";
import { useStudy } from "@/lib/study-store";
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
  const { chapterViews, completeChapter, loading } = useStudy();

  // Today focus: first non-done chapter per module (unlocked first, otherwise next locked one).
  const focus: typeof chapterViews = (() => {
    const byModule = new Map<string, typeof chapterViews>();
    for (const c of chapterViews) {
      if (!byModule.has(c.moduleId)) byModule.set(c.moduleId, []);
      byModule.get(c.moduleId)!.push(c);
    }
    const picks: typeof chapterViews = [];
    for (const [, list] of byModule) {
      const next = list.find((c) => !c.done);
      if (next) picks.push(next);
    }
    return picks;
  })();

  const handleComplete = async (id: string) => {
    try {
      await completeChapter(id);
      toast.success("Chapter complete — next one unlocked 🚀");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-vibrant-from" /> Keep the streak alive
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-vibrant">Today Focus</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Your next chapter for each module. Finish one and the following unlocks instantly.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your modules…
        </div>
      ) : focus.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No chapters yet — head to <span className="font-medium">Modules</span> to add one, or run the seed SQL.
          </p>
        </div>
      ) : (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Next up</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {focus.map((c) => {
              const card: Module = {
                id: c.id,
                code: c.moduleCode,
                chapter: `Chapter ${c.chapterNumber}`,
                title: c.title,
                description: c.description,
                progress: c.progress,
                locked: c.locked,
                done: c.done,
                unlockHint: c.unlockHint,
              };
              return <ModuleCard key={c.id} module={card} onComplete={handleComplete} />;
            })}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
