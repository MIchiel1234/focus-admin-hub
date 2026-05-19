import { directSupabase } from "@/lib/direct-supabase";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

async function uid() {
  const { data } = await directSupabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const getNotes = async () => {
  await uid();
  const { data, error } = await directSupabase
    .from("notes")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((n: any) => ({ id: n.id, title: n.title, body: n.body, date: fmtDate(n.created_at) }));
};

export const createNote = async ({ data }: { data: { title: string; body: string } }) => {
  const user_id = await uid();
  const { data: note, error } = await directSupabase
    .from("notes")
    .insert({ user_id, title: data.title, body: data.body })
    .select("id, title, body, created_at")
    .single();
  if (error) throw error;
  return { id: note.id, title: note.title, body: note.body, date: fmtDate(note.created_at) };
};

export const deleteNote = async ({ data }: { data: { id: string } }) => {
  const { error } = await directSupabase.from("notes").delete().eq("id", data.id);
  if (error) throw error;
  return { id: data.id };
};
