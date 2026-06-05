import { directSupabase as supabase } from "@/lib/direct-supabase";

type Color = "vibrant" | "accent" | "muted";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const getCalendarEvents = async () => {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, user_id, event_date, title, color")
    .eq("user_id", user_id)
    .order("event_date");
  if (error) throw error;
  return (data ?? []).filter((e: any) => e.user_id === user_id).map((e: any) => ({ id: e.id, date: e.event_date, title: e.title, color: e.color as Color }));
};

export const createCalendarEvent = async ({ data }: { data: { date: string; title: string; color?: Color } }) => {
  const user_id = await uid();
  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({ user_id, event_date: data.date, title: data.title, color: data.color ?? "vibrant" })
    .select("id, event_date, title, color")
    .single();
  if (error) throw error;
  return { id: event.id, date: event.event_date, title: event.title, color: event.color as Color };
};

export const deleteCalendarEvent = async ({ data }: { data: { id: string } }) => {
  const user_id = await uid();
  const { error } = await supabase.from("calendar_events").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
};
