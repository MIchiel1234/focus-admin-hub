import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { ModuleCard, type Module } from "@/components/ModuleCard";

const modules: Module[] = [
  {
    id: "ch5",
    code: "TAX3761",
    chapter: "Chapter 5",
    title: "Capital Gains Tax",
    description: "Disposal events, base cost, exclusions and inclusion rates.",
    progress: 60,
    locked: false,
  },
  {
    id: "ch6",
    code: "TAX3761",
    chapter: "Chapter 6",
    title: "Trusts & Estate Duty",
    description: "Conduit principle, attribution rules and estate duty computation.",
    progress: 0,
    locked: true,
    unlockHint: "Finish Chapter 5",
  },
];

export const Route = createFileRoute("/modules")({
  component: ModulesPage,
  head: () => ({ meta: [{ title: "Modules — Admin" }] }),
});

function ModulesPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Modules</span>
        </h1>
        <p className="mt-2 text-muted-foreground">All your chapters and study material.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <ModuleCard key={m.id} module={m} />
        ))}
      </div>
    </DashboardShell>
  );
}
