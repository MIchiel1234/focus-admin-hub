import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Target, CheckCircle2, Circle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStudy, type DbGoal } from "@/lib/study-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals")({
  component: GoalsPage,
  head: () => ({ meta: [{ title: "Goals — Admin" }] }),
});

function GoalsPage() {
  const { goals, addGoal, toggleGoal, removeGoal } = useStudy();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    try {
      await addGoal({
        title: title.trim().slice(0, 120),
        due_date: dueDate || null,
      });
      setTitle(""); setDueDate("");
      setOpen(false);
      toast.success("Goal set 🎯");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const active = goals.filter((g) => !g.is_done);
  const done = goals.filter((g) => g.is_done);

  return (
    <DashboardShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-vibrant">Goals</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Set targets and check them off as you go.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-vibrant text-primary-foreground border-0 shadow-vibrant">
              <Plus className="mr-2 h-4 w-4" /> New goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a goal</DialogTitle>
              <DialogDescription>Make it specific and time-bound.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="g-title">Goal</Label>
                <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finish TAX3761 Chapter 5" maxLength={120} />
              </div>
              <div>
                <Label htmlFor="g-due">Due date (optional)</Label>
                <Input id="g-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} className="bg-vibrant text-primary-foreground border-0">Save goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Target className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No goals yet. Set your first one to get the streak going.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Active</h2>
            <div className="space-y-2">
              {active.length === 0 && <p className="text-sm text-muted-foreground">All done. Add a new goal.</p>}
              {active.map((g) => (
                <GoalRow key={g.id} g={g} onToggle={() => toggleGoal(g.id, true)} onRemove={() => removeGoal(g.id)} />
              ))}
            </div>
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Completed</h2>
              <div className="space-y-2">
                {done.map((g) => (
                  <GoalRow key={g.id} g={g} onToggle={() => toggleGoal(g.id, false)} onRemove={() => removeGoal(g.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function GoalRow({ g, onToggle, onRemove }: { g: DbGoal; onToggle: () => void; onRemove: () => void }) {
  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-card",
      g.is_done && "opacity-60"
    )}>
      <button onClick={onToggle} className="mt-0.5 shrink-0">
        {g.is_done ? <CheckCircle2 className="h-5 w-5 text-vibrant-from" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
      </button>
      <div className="flex-1">
        <p className={cn("font-medium", g.is_done && "line-through")}>{g.title}</p>
        {g.due_date && <p className="mt-1 text-xs text-muted-foreground">Due {new Date(g.due_date).toLocaleDateString()}</p>}
      </div>
      <button onClick={onRemove} className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
