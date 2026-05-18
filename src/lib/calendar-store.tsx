import { createContext, useContext, useState, type ReactNode } from "react";

export interface CalendarEvent {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  color?: "vibrant" | "accent" | "muted";
}

interface Ctx {
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  removeEvent: (id: string) => void;
  eventsForDate: (date: Date) => CalendarEvent[];
}

const CalendarCtx = createContext<Ctx | null>(null);

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarProvider({ children }: { children: ReactNode }) {
  const today = new Date();
  const seedDate = toKey(today);
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "seed-1", date: seedDate, title: "TAX3761 — Chapter 5 review", color: "vibrant" },
  ]);

  const addEvent: Ctx["addEvent"] = (e) =>
    setEvents((prev) => [...prev, { ...e, id: crypto.randomUUID() }]);
  const removeEvent: Ctx["removeEvent"] = (id) =>
    setEvents((prev) => prev.filter((x) => x.id !== id));
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
