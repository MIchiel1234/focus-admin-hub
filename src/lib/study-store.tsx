import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  addSubject: (s: Omit<Subject, "id">) => Subject;
  addModule: (m: Omit<StudyModule, "id">) => void;
  updateModule: (id: string, patch: Partial<StudyModule>) => void;
  removeModule: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "done" | "createdAt">) => void;
  toggleGoal: (id: string) => void;
  removeGoal: (id: string) => void;
}

const StudyCtx = createContext<Ctx | null>(null);
const KEY = "admin.study.v1";

const defaults = {
  subjects: [{ id: "tax3761", code: "TAX3761", name: "Taxation of Business Activities" }] as Subject[],
  modules: [
    { id: "ch5", subjectId: "tax3761", chapter: "Chapter 5", title: "Capital Gains Tax", description: "Disposal events, base cost, inclusion rates.", progress: 60 },
    { id: "ch6", subjectId: "tax3761", chapter: "Chapter 6", title: "Trusts & Estate Duty", description: "Conduit principle, attribution, estate duty.", progress: 0 },
  ] as StudyModule[],
  goals: [] as Goal[],
};

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...defaults, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const ctx: Ctx = {
    ...state,
    addSubject: (s) => {
      const subject: Subject = { ...s, id: crypto.randomUUID() };
      setState((p) => ({ ...p, subjects: [...p.subjects, subject] }));
      return subject;
    },
    addModule: (m) =>
      setState((p) => ({ ...p, modules: [...p.modules, { ...m, id: crypto.randomUUID() }] })),
    updateModule: (id, patch) =>
      setState((p) => ({ ...p, modules: p.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
    removeModule: (id) =>
      setState((p) => ({ ...p, modules: p.modules.filter((m) => m.id !== id) })),
    addGoal: (g) =>
      setState((p) => ({
        ...p,
        goals: [...p.goals, { ...g, id: crypto.randomUUID(), done: false, createdAt: Date.now() }],
      })),
    toggleGoal: (id) =>
      setState((p) => ({ ...p, goals: p.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) })),
    removeGoal: (id) =>
      setState((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) })),
  };

  return <StudyCtx.Provider value={ctx}>{children}</StudyCtx.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyCtx);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
