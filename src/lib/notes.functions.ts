import { directSupabase as supabase } from "@/lib/direct-supabase";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const getNotes = async () => {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("notes")
    .select("id, user_id, title, body, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).filter((n: any) => n.user_id === user_id).map((n: any) => ({ id: n.id, title: n.title, body: n.body, date: fmtDate(n.created_at) }));
};

export const createNote = async ({ data }: { data: { title: string; body: string } }) => {
  const user_id = await uid();
  const { data: note, error } = await supabase
    .from("notes")
    .insert({ user_id, title: data.title, body: data.body })
    .select("id, title, body, created_at")
    .single();
  if (error) throw error;
  return { id: note.id, title: note.title, body: note.body, date: fmtDate(note.created_at) };
};

export const deleteNote = async ({ data }: { data: { id: string } }) => {
  const user_id = await uid();
  const { error } = await supabase.from("notes").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
};
