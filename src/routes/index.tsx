import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Sparkles, Plus } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { ModuleCard, type Module } from "@/components/ModuleCard";
import { useStudy } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
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
  const { subjects, modules: studyModules, updateModule, addModuleFile, removeModuleFile } = useStudy();

  // Show only what the user has added. Sequential unlock: each chapter unlocks
  // when the previous one (within the same subject) is done.
  const sorted = [...studyModules].sort((a, b) => {
    if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
    const na = Number(a.chapter.match(/\d+/)?.[0] ?? 0);
    const nb = Number(b.chapter.match(/\d+/)?.[0] ?? 0);
    return na - nb;
  });

  const modules: Module[] = sorted.map((m, i) => {
    const prev = i > 0 && sorted[i - 1].subjectId === m.subjectId ? sorted[i - 1] : null;
    const locked = prev ? !prev.done : false;
    const subject = subjects.find((s) => s.id === m.subjectId);
    return {
      id: m.id,
      code: subject?.code ?? "",
      subjectName: subject?.name,
      chapter: m.chapter,
      title: m.title,
      description: m.description ?? "",
      progress: m.progress,
      locked,
      done: m.done,
      unlockHint: prev ? `Finish ${prev.chapter}` : undefined,
      attachments: m.attachments,
    };
  });

  const handleComplete = async (id: string) => {
    await updateModule(id, { done: true, progress: 100 });
    toast.success("Chapter complete! 🚀", {
      description: "Next chapter unlocked.",
    });
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-vibrant-from" /> Today Focus
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-vibrant">Your Chapters</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Finish a chapter to unlock the next one in the same subject.
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Modules</h2>

        {modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-vibrant-from" />
            <h3 className="text-lg font-semibold">Nothing here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a subject and chapters to start tracking your focus.
            </p>
            <Button asChild className="mt-5 bg-vibrant text-primary-foreground hover:opacity-90 border-0 shadow-vibrant">
              <Link to="/modules">
                <Plus className="mr-2 h-4 w-4" /> Add modules
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((m) => (
              <ModuleCard key={m.id} module={m} onComplete={handleComplete} onUploadFile={addModuleFile} onRemoveFile={removeModuleFile} />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
