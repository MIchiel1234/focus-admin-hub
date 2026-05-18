import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

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
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, event_date, title, color")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    if (error) throw error;
    setEvents((data ?? []).map((event) => ({
      id: event.id,
      date: event.event_date,
      title: event.title,
      color: event.color as CalendarEvent["color"],
    })));
  }, [user]);

  useEffect(() => {
    refresh().catch((error) => console.error(error));
  }, [refresh]);

  const addEvent: Ctx["addEvent"] = async (e) => {
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      event_date: e.date,
      title: e.title,
      color: e.color ?? "vibrant",
    });
    if (error) throw error;
    await refresh();
  };

  const removeEvent: Ctx["removeEvent"] = async (id) => {
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    await refresh();
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
