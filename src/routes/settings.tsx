import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
});

function SettingsPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Settings</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Tune your study dashboard.</p>
      </div>
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" defaultValue="Student" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Sequential unlocks</Label>
            <p className="text-sm text-muted-foreground">Lock chapters until prerequisites are done.</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Vibrant mode</Label>
            <p className="text-sm text-muted-foreground">Colorful accents across the app.</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </DashboardShell>
  );
}
