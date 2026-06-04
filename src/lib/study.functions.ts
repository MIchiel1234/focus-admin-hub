import { directSupabase as supabase } from "@/lib/direct-supabase";

const BUCKET = "chapter-files";

export interface ChapterAttachment {
  path: string;
  name: string;
  size: number;
  type: string;
}

const chapterNumberFrom = (chapter: string) => {
  const m = chapter.match(/\d+/);
  return m ? Number(m[0]) : 1;
};

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

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const getStudyData = async () => {
  const userId = await uid();
  const sb = supabase;

  let { data: subjects, error: subjectsError } = await sb
    .from("modules")
    .select("id, user_id, code, title, created_at")
    .eq("user_id", userId)
    .order("created_at");
  if (subjectsError) throw subjectsError;

  const [{ data: chapters, error: chErr }, { data: progress, error: prErr }, { data: goals, error: glErr }] = await Promise.all([
    sb.from("chapters").select("id, user_id, module_id, chapter_number, title, description, attachments, created_at").eq("user_id", userId).order("chapter_number"),
    sb.from("user_progress").select("id, user_id, chapter_id, current_progress_percent, is_completed, completed_at").eq("user_id", userId),
    sb.from("goals").select("id, user_id, title, due_date, is_done, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (chErr) throw chErr;
  if (prErr) throw prErr;
  if (glErr) throw glErr;

  return {
    subjects: (subjects ?? []).filter((s: any) => s.user_id === userId).map((s: any) => ({ id: s.id, code: s.code, name: s.title })),
    modules: (chapters ?? []).filter((c: any) => c.user_id === userId).map((c: any) => {
      const p = progress?.find((x: any) => x.user_id === userId && x.chapter_id === c.id);
      return {
        id: c.id,
        subjectId: c.module_id,
        chapter: `Chapter ${c.chapter_number}`,
        title: c.title,
        description: c.description ?? "",
        progress: p?.is_completed ? 100 : p?.current_progress_percent ?? 0,
        done: p?.is_completed ?? false,
        attachments: (c.attachments ?? []) as ChapterAttachment[],
      };
    }),
    goals: (goals ?? []).filter((g: any) => g.user_id === userId).map((g: any) => ({ id: g.id, title: g.title, dueDate: g.due_date ?? undefined, done: g.is_done, createdAt: new Date(g.created_at).getTime() })),
  };
};

export const createSubject = async ({ data }: { data: { code: string; name: string } }) => {
  const user_id = await uid();
  const { data: s, error } = await supabase
    .from("modules")
    .insert({ user_id, code: data.code, title: data.name })
    .select("id, code, title")
    .single();
  if (error) throw error;
  return { id: s.id, code: s.code, name: s.title };
};

export const createChapter = async ({ data }: { data: { subjectId: string; chapter: string; title: string; description?: string; progress?: number } }) => {
  const user_id = await uid();
  const { data: c, error } = await supabase
    .from("chapters")
    .insert({ user_id, module_id: data.subjectId, chapter_number: chapterNumberFrom(data.chapter), title: data.title, description: data.description ?? "" })
    .select("id, module_id, chapter_number, title, description, attachments")
    .single();
  if (error) throw error;
  return { id: c.id, subjectId: c.module_id, chapter: `Chapter ${c.chapter_number}`, title: c.title, description: c.description ?? "", progress: data.progress ?? 0, done: false, attachments: (c.attachments ?? []) as ChapterAttachment[] };
};

export const updateChapterProgress = async ({ data }: { data: { id: string; done?: boolean; progress?: number } }) => {
  const user_id = await uid();
  const sb = supabase;
  const percent = data.done ? 100 : data.progress ?? 0;
  const { data: existing, error: selErr } = await sb.from("user_progress").select("id").eq("user_id", user_id).eq("chapter_id", data.id).limit(1);
  if (selErr) throw selErr;
  const payload = { current_progress_percent: percent, is_completed: data.done ?? percent >= 100, completed_at: data.done ? new Date().toISOString() : null };
  if (existing?.[0]) {
    const { error } = await sb.from("user_progress").update(payload).eq("id", existing[0].id).eq("user_id", user_id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("user_progress").insert({ user_id, chapter_id: data.id, ...payload });
    if (error) throw error;
  }
  return { id: data.id, progress: percent, done: payload.is_completed };
};

export const deleteChapter = async ({ data }: { data: { id: string } }) => {
  const user_id = await uid();
  const { data: existing } = await supabase
    .from("chapters")
    .select("attachments")
    .eq("id", data.id)
    .eq("user_id", user_id)
    .single();
  const paths = ((existing?.attachments ?? []) as ChapterAttachment[]).map((a) => a.path);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  await supabase.from("user_progress").delete().eq("user_id", user_id).eq("chapter_id", data.id);
  const { error } = await supabase.from("chapters").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
};

export const uploadChapterFile = async ({ data }: { data: { chapterId: string; file: File } }): Promise<ChapterAttachment> => {
  const user_id = await uid();
  const { file, chapterId } = data;
  const path = `${user_id}/${chapterId}/${randomId()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw upErr;
  const attachment: ChapterAttachment = { path, name: file.name, size: file.size, type: file.type };
  // append to chapter row
  const { data: row, error: selErr } = await supabase
    .from("chapters")
    .select("attachments")
    .eq("id", chapterId)
    .eq("user_id", user_id)
    .single();
  if (selErr) throw selErr;
  const next = [...(((row?.attachments ?? []) as ChapterAttachment[])), attachment];
  const { error: updErr } = await supabase
    .from("chapters")
    .update({ attachments: next })
    .eq("id", chapterId)
    .eq("user_id", user_id);
  if (updErr) throw updErr;
  return attachment;
};

export const removeChapterFile = async ({ data }: { data: { chapterId: string; path: string } }) => {
  const user_id = await uid();
  await supabase.storage.from(BUCKET).remove([data.path]);
  const { data: row } = await supabase
    .from("chapters")
    .select("attachments")
    .eq("id", data.chapterId)
    .eq("user_id", user_id)
    .single();
  const next = ((row?.attachments ?? []) as ChapterAttachment[]).filter((a) => a.path !== data.path);
  const { error } = await supabase
    .from("chapters")
    .update({ attachments: next })
    .eq("id", data.chapterId)
    .eq("user_id", user_id);
  if (error) throw error;
  return { path: data.path };
};

export const getChapterFileUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
};

export const createGoal = async ({ data }: { data: { title: string; dueDate?: string } }) => {
  const user_id = await uid();
  const { data: g, error } = await supabase
    .from("goals")
    .insert({ user_id, title: data.title, due_date: data.dueDate ?? null })
    .select("id, title, due_date, is_done, created_at")
    .single();
  if (error) throw error;
  return { id: g.id, title: g.title, dueDate: g.due_date ?? undefined, done: g.is_done, createdAt: new Date(g.created_at).getTime() };
};

export const setGoalDone = async ({ data }: { data: { id: string; done: boolean } }) => {
  const user_id = await uid();
  const { error } = await supabase.from("goals").update({ is_done: data.done }).eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return data;
};

export const deleteGoal = async ({ data }: { data: { id: string } }) => {
  const user_id = await uid();
  const { error } = await supabase.from("goals").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
};
