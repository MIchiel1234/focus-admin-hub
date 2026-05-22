import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from "@/lib/calendar.functions";

export interface CalendarEvent {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  color?: "vibrant" | "accent" | "muted";
}

interface Ctx {
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, "id">) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  eventsForDate: (date: Date) => CalendarEvent[];
}

const CalendarCtx = createContext<Ctx | null>(null);

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setEvents([]);
    if (!user) return;
    getCalendarEvents()
      .then((nextEvents) => {
        if (!cancelled) setEvents(nextEvents);
      })
      .catch((err) => console.error("[calendar] load failed", err));
    return () => {
      cancelled = true;
    };
  }, [loading, user?.id]);

  const addEvent: Ctx["addEvent"] = async (e) => {
    try {
      const event = user
        ? await createCalendarEvent({ data: e })
        : { ...e, id: crypto.randomUUID() };
      setEvents((prev) => [...prev, event]);
    } catch (err) {
      console.error("[calendar] add failed", err);
      alert("Could not save event: " + ((err as Error)?.message ?? "unknown error"));
    }
  };
  const removeEvent: Ctx["removeEvent"] = async (id) => {
    setEvents((prev) => prev.filter((x) => x.id !== id));
    if (user) await deleteCalendarEvent({ data: { id } });
  };
  const eventsForDate: Ctx["eventsForDate"] = (date) =>
    events.filter((e) => e.date === toKey(date));

  return (
    <CalendarCtx.Provider value={{ events, addEvent, removeEvent, eventsForDate }}>
      {children}
    </CalendarCtx.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarCtx);
  if (!ctx) throw new Error("useCalendar must be used inside CalendarProvider");
  return ctx;
}
