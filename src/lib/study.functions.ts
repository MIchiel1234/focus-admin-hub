import { directSupabase as supabase } from "@/lib/direct-supabase";

const chapterNumberFrom = (chapter: string) => {
  const m = chapter.match(/\d+/);
  return m ? Number(m[0]) : 1;
};

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
    sb.from("chapters").select("id, user_id, module_id, chapter_number, title, description, created_at").eq("user_id", userId).order("chapter_number"),
    sb.from("user_progress").select("id, user_id, chapter_id, current_progress_percent, is_completed, completed_at").eq("user_id", userId),
    sb.from("goals").select("id, user_id, title, due_date, is_done, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (chErr) throw chErr;
  if (prErr) throw prErr;
  if (glErr) throw glErr;

  return {
    subjects: (subjects ?? []).filter((s: any) => s.user_id === userId).map((s: any) => ({ id: s.id, code: s.code, name: s.title })),
    modules: (chapters ?? []).filter((c: any) => c.user_id === userId).map((c: any) => {
      const p = progress?.find((x: any) => x.chapter_id === c.id);
      return {
        id: c.id,
        subjectId: c.module_id,
        chapter: `Chapter ${c.chapter_number}`,
        title: c.title,
        description: c.description ?? "",
        progress: p?.is_completed ? 100 : p?.current_progress_percent ?? 0,
        done: p?.is_completed ?? false,
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
    .select("id, module_id, chapter_number, title, description")
    .single();
  if (error) throw error;
  return { id: c.id, subjectId: c.module_id, chapter: `Chapter ${c.chapter_number}`, title: c.title, description: c.description ?? "", progress: data.progress ?? 0, done: false };
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
  await supabase.from("user_progress").delete().eq("user_id", user_id).eq("chapter_id", data.id);
  const { error } = await supabase.from("chapters").delete().eq("id", data.id).eq("user_id", user_id);
  if (error) throw error;
  return { id: data.id };
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
