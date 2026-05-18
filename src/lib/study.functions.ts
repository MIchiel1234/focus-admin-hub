import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubjectSchema = z.object({ code: z.string().min(1).max(20), name: z.string().min(1).max(100) });
const ChapterSchema = z.object({ subjectId: z.string().uuid(), chapter: z.string().min(1).max(50), title: z.string().min(1).max(100), description: z.string().max(300).optional(), progress: z.number().min(0).max(100).optional() });
const IdSchema = z.object({ id: z.string().uuid() });
const UpdateChapterSchema = z.object({ id: z.string().uuid(), done: z.boolean().optional(), progress: z.number().min(0).max(100).optional() });
const GoalSchema = z.object({ title: z.string().min(1).max(120), dueDate: z.string().max(10).optional() });

const chapterNumberFrom = (chapter: string) => {
  const match = chapter.match(/\d+/);
  return match ? Number(match[0]) : 1;
};

export const getStudyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data: subjects, error: subjectsError } = await supabase.from("modules").select("id, code, title, created_at").order("created_at");
    if (subjectsError) throw subjectsError;

    if (!subjects?.length) {
      const { data: subject, error: subjectError } = await supabase
        .from("modules")
        .insert({ user_id: userId, code: "TAX3761", title: "Taxation of Business Activities" })
        .select("id, code, title, created_at")
        .single();
      if (subjectError) throw subjectError;

      const { data: chapters, error: chaptersError } = await supabase
        .from("chapters")
        .insert([
          { user_id: userId, module_id: subject.id, chapter_number: 5, title: "Capital Gains Tax", description: "Disposal events, base cost, inclusion rates." },
          { user_id: userId, module_id: subject.id, chapter_number: 6, title: "Trusts & Estate Duty", description: "Conduit principle, attribution, estate duty." },
        ])
        .select("id, chapter_number");
      if (chaptersError) throw chaptersError;

      const chapterFive = chapters?.find((chapter) => chapter.chapter_number === 5);
      if (chapterFive) {
        await supabase.from("user_progress").insert({ user_id: userId, chapter_id: chapterFive.id, current_progress_percent: 60 });
      }
      subjects = [subject];
    }

    const [{ data: chapters, error: chaptersError }, { data: progress, error: progressError }, { data: goals, error: goalsError }] = await Promise.all([
      supabase.from("chapters").select("id, module_id, chapter_number, title, description, created_at").order("chapter_number"),
      supabase.from("user_progress").select("id, chapter_id, current_progress_percent, is_completed, completed_at"),
      supabase.from("goals").select("id, title, due_date, is_done, created_at").order("created_at", { ascending: false }),
    ]);
    if (chaptersError) throw chaptersError;
    if (progressError) throw progressError;
    if (goalsError) throw goalsError;

    return {
      subjects: (subjects ?? []).map((subject) => ({ id: subject.id, code: subject.code, name: subject.title })),
      modules: (chapters ?? []).map((chapter) => {
        const p = progress?.find((item) => item.chapter_id === chapter.id);
        return {
          id: chapter.id,
          subjectId: chapter.module_id,
          chapter: `Chapter ${chapter.chapter_number}`,
          title: chapter.title,
          description: chapter.description ?? "",
          progress: p?.is_completed ? 100 : p?.current_progress_percent ?? 0,
          done: p?.is_completed ?? false,
        };
      }),
      goals: (goals ?? []).map((goal) => ({ id: goal.id, title: goal.title, dueDate: goal.due_date ?? undefined, done: goal.is_done, createdAt: new Date(goal.created_at).getTime() })),
    };
  });

export const createSubject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => SubjectSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: subject, error } = await context.supabase.from("modules").insert({ user_id: context.userId, code: data.code, title: data.name }).select("id, code, title").single();
  if (error) throw error;
  return { id: subject.id, code: subject.code, name: subject.title };
});

export const createChapter = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => ChapterSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: chapter, error } = await context.supabase.from("chapters").insert({ user_id: context.userId, module_id: data.subjectId, chapter_number: chapterNumberFrom(data.chapter), title: data.title, description: data.description ?? "" }).select("id, module_id, chapter_number, title, description").single();
  if (error) throw error;
  return { id: chapter.id, subjectId: chapter.module_id, chapter: `Chapter ${chapter.chapter_number}`, title: chapter.title, description: chapter.description ?? "", progress: data.progress ?? 0, done: false };
});

export const updateChapterProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => UpdateChapterSchema.parse(input)).handler(async ({ data, context }) => {
  const percent = data.done ? 100 : data.progress ?? 0;
  const { data: existing, error: selectError } = await context.supabase.from("user_progress").select("id").eq("chapter_id", data.id).limit(1);
  if (selectError) throw selectError;
  const payload = { current_progress_percent: percent, is_completed: data.done ?? percent >= 100, completed_at: data.done ? new Date().toISOString() : null };
  if (existing?.[0]) {
    const { error } = await context.supabase.from("user_progress").update(payload).eq("id", existing[0].id);
    if (error) throw error;
  } else {
    const { error } = await context.supabase.from("user_progress").insert({ user_id: context.userId, chapter_id: data.id, ...payload });
    if (error) throw error;
  }
  return { id: data.id, progress: percent, done: payload.is_completed };
});

export const deleteChapter = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => IdSchema.parse(input)).handler(async ({ data, context }) => {
  await context.supabase.from("user_progress").delete().eq("chapter_id", data.id);
  const { error } = await context.supabase.from("chapters").delete().eq("id", data.id);
  if (error) throw error;
  return { id: data.id };
});

export const createGoal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => GoalSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: goal, error } = await context.supabase.from("goals").insert({ user_id: context.userId, title: data.title, due_date: data.dueDate ?? null }).select("id, title, due_date, is_done, created_at").single();
  if (error) throw error;
  return { id: goal.id, title: goal.title, dueDate: goal.due_date ?? undefined, done: goal.is_done, createdAt: new Date(goal.created_at).getTime() };
});

export const setGoalDone = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("goals").update({ is_done: data.done }).eq("id", data.id);
  if (error) throw error;
  return data;
});

export const deleteGoal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => IdSchema.parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("goals").delete().eq("id", data.id);
  if (error) throw error;
  return { id: data.id };
});