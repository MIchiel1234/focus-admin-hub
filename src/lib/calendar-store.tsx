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
  const today = new Date();
  const seedDate = toKey(today);
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "seed-1", date: seedDate, title: "TAX3761 — Chapter 5 review", color: "vibrant" },
  ]);

  useEffect(() => {
    if (loading || !user) return;
    getCalendarEvents().then(setEvents).catch(() => {});
  }, [loading, user]);

  const addEvent: Ctx["addEvent"] = async (e) => {
    const event = user ? await createCalendarEvent({ data: e }) : { ...e, id: crypto.randomUUID() };
    setEvents((prev) => [...prev, event]);
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
