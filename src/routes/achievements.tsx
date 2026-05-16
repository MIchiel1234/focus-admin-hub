import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Trophy, Flame, Star, Zap } from "lucide-react";

const achievements = [
  { icon: Flame, title: "7-Day Streak", desc: "Studied every day this week.", earned: true },
  { icon: Star, title: "First Chapter Done", desc: "Wrapped your first chapter.", earned: true },
  { icon: Trophy, title: "Module Master", desc: "Complete all chapters in a module.", earned: false },
  { icon: Zap, title: "Speed Runner", desc: "Finish a chapter in under 2 days.", earned: false },
];

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
  head: () => ({ meta: [{ title: "Achievements — Admin" }] }),
});

function AchievementsPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Achievements</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Badges you've collected on the grind.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((a) => (
          <div
            key={a.title}
            className={`rounded-xl border p-5 ${a.earned ? "border-border bg-card shadow-card" : "border-border bg-locked/40 grayscale"}`}
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${a.earned ? "bg-vibrant shadow-vibrant" : "bg-locked text-locked-foreground"}`}
            >
              <a.icon className={`h-5 w-5 ${a.earned ? "text-primary-foreground" : ""}`} />
            </div>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
