import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { ModuleCard, type Module } from "@/components/ModuleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudy } from "@/lib/study-store";
import { toast } from "sonner";

export const Route = createFileRoute("/modules")({
  component: ModulesPage,
  head: () => ({ meta: [{ title: "Modules — Admin" }] }),
});

function ModulesPage() {
  const { subjects, modules, addSubject, addModule, updateModule, removeModule } = useStudy();
  const [openSubject, setOpenSubject] = useState(false);
  const [openModule, setOpenModule] = useState(false);

  // Subject form
  const [subjCode, setSubjCode] = useState("");
  const [subjName, setSubjName] = useState("");

  // Module form
  const [modSubject, setModSubject] = useState<string>(subjects[0]?.id ?? "");
  const [modChapter, setModChapter] = useState("");
  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");

  const grouped = useMemo(() => {
    return subjects.map((s) => ({
      subject: s,
      mods: modules.filter((m) => m.subjectId === s.id),
    }));
  }, [subjects, modules]);

  const submitSubject = async () => {
    if (!subjCode.trim() || !subjName.trim()) return;
    const s = await addSubject({ code: subjCode.trim().toUpperCase().slice(0, 20), name: subjName.trim().slice(0, 100) });
    setModSubject(s.id);
    setSubjCode(""); setSubjName(""); setOpenSubject(false);
    toast.success("Subject added");
  };

  const submitModule = async () => {
    if (!modSubject || !modChapter.trim() || !modTitle.trim()) return;
    await addModule({
      subjectId: modSubject,
      chapter: modChapter.trim().slice(0, 50),
      title: modTitle.trim().slice(0, 100),
      description: modDesc.trim().slice(0, 300),
      progress: 0,
    });
    setModChapter(""); setModTitle(""); setModDesc(""); setOpenModule(false);
    toast.success("Module added");
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-vibrant">Modules</span>
          </h1>
          <p className="mt-2 text-muted-foreground">All your subjects and chapters.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openSubject} onOpenChange={setOpenSubject}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a subject</DialogTitle>
                <DialogDescription>Create a new subject to group modules under.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="s-code">Code</Label>
                  <Input id="s-code" value={subjCode} onChange={(e) => setSubjCode(e.target.value)} placeholder="TAX3761" maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="s-name">Name</Label>
                  <Input id="s-name" value={subjName} onChange={(e) => setSubjName(e.target.value)} placeholder="Taxation of Business Activities" maxLength={100} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitSubject} className="bg-vibrant text-primary-foreground border-0">Add subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openModule} onOpenChange={(o) => { setOpenModule(o); if (o && !modSubject) setModSubject(subjects[0]?.id ?? ""); }}>
            <DialogTrigger asChild>
              <Button className="bg-vibrant text-primary-foreground border-0 shadow-vibrant"><Plus className="mr-2 h-4 w-4" /> Module</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a module</DialogTitle>
                <DialogDescription>Add a chapter or unit to a subject.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Subject</Label>
                  <Select value={modSubject} onValueChange={setModSubject}>
                    <SelectTrigger><SelectValue placeholder="Pick a subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="m-chapter">Chapter</Label>
                  <Input id="m-chapter" value={modChapter} onChange={(e) => setModChapter(e.target.value)} placeholder="Chapter 7" maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="m-title">Title</Label>
                  <Input id="m-title" value={modTitle} onChange={(e) => setModTitle(e.target.value)} placeholder="VAT" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="m-desc">Description</Label>
                  <Input id="m-desc" value={modDesc} onChange={(e) => setModDesc(e.target.value)} placeholder="Short summary" maxLength={300} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitModule} disabled={!modSubject} className="bg-vibrant text-primary-foreground border-0">Add module</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-10">
        {grouped.map(({ subject, mods }) => (
          <section key={subject.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {subject.code} · <span className="text-foreground/80 normal-case tracking-normal">{subject.name}</span>
              </h2>
              <span className="text-xs text-muted-foreground">{mods.length} module{mods.length === 1 ? "" : "s"}</span>
            </div>
            {mods.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No modules yet. Click "Module" to add one.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {mods.map((m) => {
                  const card: Module = {
                    id: m.id,
                    code: subject.code,
                    chapter: m.chapter,
                    title: m.title,
                    description: m.description ?? "",
                    progress: m.progress,
                    locked: false,
                    done: m.done,
                  };
                  return (
                    <div key={m.id} className="relative group">
                      <ModuleCard module={card} onComplete={() => updateModule(m.id, { done: true, progress: 100 })} />
                      <button
                        onClick={() => removeModule(m.id)}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                        title="Delete module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
