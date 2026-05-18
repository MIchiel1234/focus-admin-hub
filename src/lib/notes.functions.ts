import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NoteSchema = z.object({ title: z.string().min(1).max(120), body: z.string().max(2000) });
const IdSchema = z.object({ id: z.string().uuid() });

export const getNotes = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("notes").select("id, title, body, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    date: new Date(note.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  }));
});

export const createNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => NoteSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: note, error } = await context.supabase.from("notes").insert({ user_id: context.userId, title: data.title, body: data.body }).select("id, title, body, created_at").single();
  if (error) throw error;
  return { id: note.id, title: note.title, body: note.body, date: new Date(note.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) };
});

export const deleteNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => IdSchema.parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("notes").delete().eq("id", data.id);
  if (error) throw error;
  return { id: data.id };
});