import { directSupabase as supabase } from "@/lib/direct-supabase";

const BUCKET = "note-files";

export interface NoteAttachment {
  path: string;
  name: string;
  size: number;
  type: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

function randomId() {
  const c: any = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const getNotes = async () => {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("notes")
    .select("id, user_id, title, body, attachments, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((n: any) => n.user_id === user_id)
    .map((n: any) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      attachments: (n.attachments ?? []) as NoteAttachment[],
      date: fmtDate(n.created_at),
    }));
};

export const createNote = async ({
  data,
}: {
  data: { title: string; body: string; attachments?: NoteAttachment[] };
}) => {
  const user_id = await uid();
  const { data: note, error } = await supabase
    .from("notes")
    .insert({ user_id, title: data.title, body: data.body, attachments: data.attachments ?? [] })
    .select("id, title, body, attachments, created_at")
    .single();
  if (error) throw error;
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    attachments: (note.attachments ?? []) as NoteAttachment[],
    date: fmtDate(note.created_at),
  };
};

export const deleteNote = async ({ data }: { data: { id: string } }) => {
  const user_id = await uid();
  // fetch attachments to clean up storage
  const { data: existing } = await supabase
    .from("notes")
    .select("attachments")
    .eq("id", data.id)
    .eq("user_id", user_id)
    .single();
  const paths = ((existing?.attachments ?? []) as NoteAttachment[]).map((a) => a.path);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  const { error } = await supabase.from("notes").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
};

export const uploadNoteFile = async (file: File): Promise<NoteAttachment> => {
  const user_id = await uid();
  const path = `${user_id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path, name: file.name, size: file.size, type: file.type };
};

export const getNoteFileUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
};
