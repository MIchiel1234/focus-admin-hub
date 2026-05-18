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
  const { subjects, modules: studyModules, updateModule } = useStudy();
  const taxSubject = subjects.find((subject) => subject.code === "TAX3761") ?? subjects[0];
  const chapter5 = studyModules.find((module) => module.subjectId === taxSubject?.id && module.chapter.includes("5"));
  const chapter6 = studyModules.find((module) => module.subjectId === taxSubject?.id && module.chapter.includes("6"));
  const isChapter5Done = Boolean(chapter5?.done);

  const modules: Module[] = [
    {
      id: chapter5?.id ?? "ch5",
      code: taxSubject?.code ?? "TAX3761",
      chapter: chapter5?.chapter ?? "Chapter 5",
      title: chapter5?.title ?? "Capital Gains Tax",
      description: chapter5?.description ?? "Disposal events, base cost, exclusions and inclusion rates.",
      progress: chapter5?.progress ?? 60,
      locked: false,
      done: isChapter5Done,
    },
    {
      id: chapter6?.id ?? "ch6",
      code: taxSubject?.code ?? "TAX3761",
      chapter: chapter6?.chapter ?? "Chapter 6",
      title: chapter6?.title ?? "Trusts & Estate Duty",
      description: chapter6?.description ?? "Conduit principle, attribution rules and estate duty computation.",
      progress: chapter6?.progress ?? 0,
      locked: !isChapter5Done,
      done: chapter6?.done,
      unlockHint: "Finish Chapter 5",
    },
  ];

  const handleComplete = async (id: string) => {
    if (id === chapter5?.id || id === "ch5") {
      await updateModule(id, { done: true, progress: 100 });
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
              onClick={() => chapter5 && updateModule(chapter5.id, { done: false, progress: 60 })}
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
