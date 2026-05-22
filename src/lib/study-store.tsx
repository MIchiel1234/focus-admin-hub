import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { createChapter, createGoal, createSubject, deleteChapter, deleteGoal, getStudyData, setGoalDone, updateChapterProgress } from "@/lib/study.functions";

export interface Subject {
  id: string;
  code: string; // e.g. "TAX3761"
  name: string; // e.g. "Taxation of Business Activities"
}

export interface StudyModule {
  id: string;
  subjectId: string;
  chapter: string; // e.g. "Chapter 7"
  title: string;
  description?: string;
  progress: number; // 0-100
  done?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  detail?: string;
  dueDate?: string; // yyyy-mm-dd
  done: boolean;
  createdAt: number;
}

interface Ctx {
  subjects: Subject[];
  modules: StudyModule[];
  goals: Goal[];
  loading: boolean;
  addSubject: (s: Omit<Subject, "id">) => Promise<Subject>;
  addModule: (m: Omit<StudyModule, "id">) => Promise<void>;
  updateModule: (id: string, patch: Partial<StudyModule>) => Promise<void>;
  removeModule: (id: string) => Promise<void>;
  addGoal: (g: Omit<Goal, "id" | "done" | "createdAt">) => Promise<void>;
  toggleGoal: (id: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

const StudyCtx = createContext<Ctx | null>(null);

const defaults = {
  subjects: [] as Subject[],
  modules: [] as StudyModule[],
  goals: [] as Goal[],
};

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(defaults);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const { user, loading: loadingAuth } = useAuth();

  useEffect(() => {
    if (loadingAuth) return;
    setState(defaults);
  }, [loadingAuth, user?.id]);

  useEffect(() => {
    if (loadingAuth || !user) return;
    let cancelled = false;
    setState(defaults);
    setLoadingStudy(true);
    getStudyData()
      .then((data) => {
        if (!cancelled) setState({ subjects: data.subjects, modules: data.modules, goals: data.goals });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStudy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadingAuth, user?.id]);

  const ctx: Ctx = {
    ...state,
    loading: loadingAuth || loadingStudy,
    addSubject: async (s) => {
      const subject: Subject = user ? await createSubject({ data: s }) : { ...s, id: crypto.randomUUID() };
      setState((p) => ({ ...p, subjects: [...p.subjects, subject] }));
      return subject;
    },
    addModule: async (m) => {
      const module = user ? await createChapter({ data: m }) : { ...m, id: crypto.randomUUID() };
      setState((p) => ({ ...p, modules: [...p.modules, module] }));
    },
    updateModule: async (id, patch) => {
      setState((p) => ({ ...p, modules: p.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
      if (user && (typeof patch.done === "boolean" || typeof patch.progress === "number")) {
        await updateChapterProgress({ data: { id, done: patch.done, progress: patch.progress } });
      }
    },
    removeModule: async (id) => {
      setState((p) => ({ ...p, modules: p.modules.filter((m) => m.id !== id) }));
      if (user) await deleteChapter({ data: { id } });
    },
    addGoal: async (g) => {
      const goal = user ? await createGoal({ data: { title: g.title, dueDate: g.dueDate } }) : { ...g, id: crypto.randomUUID(), done: false, createdAt: Date.now() };
      setState((p) => ({
        ...p,
        goals: [...p.goals, goal],
      }));
    },
    toggleGoal: async (id) => {
      const nextDone = !state.goals.find((g) => g.id === id)?.done;
      setState((p) => ({ ...p, goals: p.goals.map((g) => (g.id === id ? { ...g, done: nextDone } : g)) }));
      if (user) await setGoalDone({ data: { id, done: nextDone } });
    },
    removeGoal: async (id) => {
      setState((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) }));
      if (user) await deleteGoal({ data: { id } });
    },
  };

  return <StudyCtx.Provider value={ctx}>{children}</StudyCtx.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyCtx);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
