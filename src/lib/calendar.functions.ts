import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EventSchema = z.object({ date: z.string().min(10).max(10), title: z.string().min(1).max(160), color: z.enum(["vibrant", "accent", "muted"]).optional() });
const IdSchema = z.object({ id: z.string().uuid() });

export const getCalendarEvents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("calendar_events").select("id, event_date, title, color").order("event_date");
  if (error) throw error;
  return (data ?? []).map((event) => ({ id: event.id, date: event.event_date, title: event.title, color: event.color as "vibrant" | "accent" | "muted" }));
});

export const createCalendarEvent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => EventSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: event, error } = await context.supabase
    .from("calendar_events")
    .insert({ user_id: context.userId, event_date: data.date, title: data.title, color: data.color ?? "vibrant" })
    .select("id, event_date, title, color")
    .single();
  if (error) throw error;
  return { id: event.id, date: event.event_date, title: event.title, color: event.color as "vibrant" | "accent" | "muted" };
});

export const deleteCalendarEvent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => IdSchema.parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("calendar_events").delete().eq("id", data.id);
  if (error) throw error;
  return { id: data.id };
});