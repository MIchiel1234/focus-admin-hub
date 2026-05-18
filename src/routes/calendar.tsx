import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCalendar, toKey } from "@/lib/calendar-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Calendar — Admin" }] }),
});

function CalendarPage() {
  return (
    <DashboardShell>
      <CalendarInner />
    </DashboardShell>
  );
}

function CalendarInner() {
  const { events, addEvent, removeEvent, eventsForDate } = useCalendar();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");

  const datesWithEvents = new Set(events.map((e) => e.date));
  const dayEvents = selected ? eventsForDate(selected) : [];

  const handleAdd = async () => {
    if (!selected || !title.trim()) return;
    try {
      await addEvent({ date: toKey(selected), title: title.trim(), color: "vibrant" });
      setTitle("");
      toast.success("Event added");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Calendar</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Tap a date to add study sessions, exams, and deadlines.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ hasEvent: (d) => datesWithEvents.has(toKey(d)) }}
            modifiersClassNames={{
              hasEvent:
                "relative font-semibold text-foreground after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-[var(--vibrant-from)]",
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vibrant shadow-vibrant">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {selected
                  ? selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                  : "Pick a date"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
              </p>
            </div>
          </div>

          <div className="mb-5 flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add an event…"
              disabled={!selected}
            />
            <Button
              onClick={handleAdd}
              disabled={!selected || !title.trim()}
              className="bg-vibrant text-primary-foreground border-0 shadow-vibrant hover:opacity-90"
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          {dayEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No events on this date yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((e) => (
                <li
                  key={e.id}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-vibrant" />
                    <span className="text-sm">{e.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(e.id).catch((error) => toast.error((error as Error).message))}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">All upcoming</h2>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          {events.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...events]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-vibrant/15 px-2 py-1 text-xs font-medium text-vibrant">{e.date}</span>
                      <span className="text-sm">{e.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeEvent(e.id).catch((error) => toast.error((error as Error).message))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
