import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

// Schema alignment:
//   SQL `modules`     -> a subject (e.g. TAX3761)
//   SQL `chapters`    -> a chapter inside a module
//   SQL `user_progress` -> per-user completion / progress
//   SQL `goals`       -> user goals

export interface DbModule {
  id: string;
  code: string;
  title: string;
}

export interface DbChapter {
  id: string;
  module_id: string;
  chapter_number: number;
  title: string;
  description: string | null;
  is_locked: boolean;
}

export interface UserProgressRow {
  chapter_id: string;
  is_completed: boolean;
  current_progress_percent: number;
}

export interface DbGoal {
  id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
}

// Friendly view: a chapter joined with the user's progress + computed unlock.
export interface ChapterView {
  id: string;
  moduleId: string;
  moduleCode: string;
  chapterNumber: number;
  title: string;
  description: string;
  progress: number;
  done: boolean;
  locked: boolean;
  unlockHint?: string;
}

interface Ctx {
  loading: boolean;
  modules: DbModule[];
  chapters: DbChapter[];
  chapterViews: ChapterView[];
  goals: DbGoal[];
  refresh: () => Promise<void>;
  addModule: (m: { code: string; title: string }) => Promise<void>;
  addChapter: (c: { module_id: string; chapter_number: number; title: string; description?: string }) => Promise<void>;
  removeChapter: (id: string) => Promise<void>;
  completeChapter: (chapter_id: string) => Promise<void>;
  setChapterProgress: (chapter_id: string, percent: number) => Promise<void>;
  addGoal: (g: { title: string; due_date?: string | null }) => Promise<void>;
  toggleGoal: (id: string, next: boolean) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

const StudyCtx = createContext<Ctx | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [modules, setModules] = useState<DbModule[]>([]);
  const [chapters, setChapters] = useState<DbChapter[]>([]);
  const [progress, setProgress] = useState<UserProgressRow[]>([]);
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setModules([]); setChapters([]); setProgress([]); setGoals([]);
      setLoading(false);
      return;
    }
    const [m, c, p, g] = await Promise.all([
      supabase
        .from("modules")
        .select("id, code, title")
        .eq("user_id", user.id)
        .order("code"),
      supabase
        .from("chapters")
        .select("id, module_id, chapter_number, title, description, is_locked")
        .eq("user_id", user.id)
        .order("chapter_number"),
      supabase
        .from("user_progress")
        .select("chapter_id, is_completed, current_progress_percent")
        .eq("user_id", user.id),
      supabase
        .from("goals")
        .select("id, title, is_done, due_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setModules((m.data ?? []) as DbModule[]);
    setChapters((c.data ?? []) as DbChapter[]);
    setProgress((p.data ?? []) as UserProgressRow[]);
    setGoals((g.data ?? []) as DbGoal[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Compute chapter views with sequential unlock: ch 1 always open;
  // others unlock when the previous chapter is completed by the user.
  const chapterViews: ChapterView[] = (() => {
    const progressByChapter = new Map(progress.map((p) => [p.chapter_id, p]));
    const moduleByCode = new Map(modules.map((m) => [m.id, m]));
    const sorted = [...chapters].sort(
      (a, b) => a.module_id.localeCompare(b.module_id) || a.chapter_number - b.chapter_number
    );

    return sorted.map((c) => {
      const mod = moduleByCode.get(c.module_id);
      const myProg = progressByChapter.get(c.id);
      const prev = sorted.find(
        (x) => x.module_id === c.module_id && x.chapter_number === c.chapter_number - 1
      );
      const prevDone = prev ? progressByChapter.get(prev.id)?.is_completed ?? false : true;
      const unlocked = c.chapter_number === 1 || prevDone;

      return {
        id: c.id,
        moduleId: c.module_id,
        moduleCode: mod?.code ?? "",
        chapterNumber: c.chapter_number,
        title: c.title,
        description: c.description ?? "",
        progress: myProg?.current_progress_percent ?? 0,
        done: myProg?.is_completed ?? false,
        locked: !unlocked,
        unlockHint: unlocked ? undefined : `Finish Ch ${c.chapter_number - 1}`,
      };
    });
  })();

  const value: Ctx = {
    loading,
    modules,
    chapters,
    chapterViews,
    goals,
    refresh,
    addModule: async ({ code, title }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("modules").insert({ code, title, user_id: user.id });
      if (error) throw error;
      await refresh();
    },
    addChapter: async (c) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("chapters").insert({
        module_id: c.module_id,
        chapter_number: c.chapter_number,
        title: c.title,
        description: c.description ?? null,
        user_id: user.id,
      });
      if (error) throw error;
      await refresh();
    },
    removeChapter: async (id) => {
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    completeChapter: async (chapter_id) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          chapter_id,
          is_completed: true,
          current_progress_percent: 100,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chapter_id" }
      );
      if (error) throw error;
      await refresh();
    },
    setChapterProgress: async (chapter_id, percent) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          chapter_id,
          current_progress_percent: percent,
          is_completed: percent >= 100,
          completed_at: percent >= 100 ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,chapter_id" }
      );
      if (error) throw error;
      await refresh();
    },
    addGoal: async ({ title, due_date }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title,
        due_date: due_date ?? null,
      });
      if (error) throw error;
      await refresh();
    },
    toggleGoal: async (id, next) => {
      const { error } = await supabase.from("goals").update({ is_done: next }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    removeGoal: async (id) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
  };

  return <StudyCtx.Provider value={value}>{children}</StudyCtx.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyCtx);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
