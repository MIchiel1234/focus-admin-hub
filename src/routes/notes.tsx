import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { VibrantNotes } from "@/components/VibrantNotes";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Vibrant Notes — Admin" }] }),
});

function NotesPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Vibrant Notes</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Your weekly wins, all in one clean notepad.</p>
      </div>
      <VibrantNotes />
    </DashboardShell>
  );
}
