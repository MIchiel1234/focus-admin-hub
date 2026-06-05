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

const NEW_SUBJECT = "__new__";

function ModulesPage() {
  const { subjects, modules, addSubject, addModule, updateModule, removeModule, addModuleFile, removeModuleFile } = useStudy();
  const [openModule, setOpenModule] = useState(false);

  // Module form
  const [modSubject, setModSubject] = useState<string>(subjects[0]?.id ?? NEW_SUBJECT);
  const [modChapter, setModChapter] = useState("");
  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");
  // New subject inline fields
  const [subjCode, setSubjCode] = useState("");
  const [subjName, setSubjName] = useState("");

  const grouped = useMemo(() => {
    return subjects.map((s) => ({
      subject: s,
      mods: modules.filter((m) => m.subjectId === s.id),
    }));
  }, [subjects, modules]);

  const resetForm = () => {
    setModChapter(""); setModTitle(""); setModDesc("");
    setSubjCode(""); setSubjName("");
  };

  const submitModule = async () => {
    if (!modChapter.trim() || !modTitle.trim()) return;

    let subjectId = modSubject;
    const creatingNew = modSubject === NEW_SUBJECT || subjects.length === 0;

    if (creatingNew) {
      if (!subjCode.trim() || !subjName.trim()) {
        toast.error("Please enter subject code and name");
        return;
      }
      const s = await addSubject({
        code: subjCode.trim().toUpperCase().slice(0, 20),
        name: subjName.trim().slice(0, 100),
      });
      subjectId = s.id;
    }

    await addModule({
      subjectId,
      chapter: modChapter.trim().slice(0, 50),
      title: modTitle.trim().slice(0, 100),
      description: modDesc.trim().slice(0, 300),
      progress: 0,
    });
    resetForm();
    setOpenModule(false);
    toast.success("Module added");
  };

  const showNewSubjectFields = modSubject === NEW_SUBJECT || subjects.length === 0;

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-vibrant">Modules</span>
          </h1>
          <p className="mt-2 text-muted-foreground">All your subjects and chapters.</p>
        </div>
        <Dialog
          open={openModule}
          onOpenChange={(o) => {
            setOpenModule(o);
            if (o) setModSubject(subjects[0]?.id ?? NEW_SUBJECT);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-vibrant text-primary-foreground border-0 shadow-vibrant">
              <Plus className="mr-2 h-4 w-4" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a module</DialogTitle>
              <DialogDescription>Pick a subject or create a new one, then add the chapter details.</DialogDescription>
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
                    <SelectItem value={NEW_SUBJECT}>+ New subject…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showNewSubjectFields && (
                <div className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="s-code">Subject code</Label>
                    <Input id="s-code" value={subjCode} onChange={(e) => setSubjCode(e.target.value)} placeholder="TAX3761" maxLength={20} />
                  </div>
                  <div>
                    <Label htmlFor="s-name">Subject name</Label>
                    <Input id="s-name" value={subjName} onChange={(e) => setSubjName(e.target.value)} placeholder="Taxation of Business Activities" maxLength={100} />
                  </div>
                </div>
              )}

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
              <Button onClick={submitModule} className="bg-vibrant text-primary-foreground border-0">Add module</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No modules yet. Click "Add Module" to create your first one.
        </p>
      ) : (
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
                  No modules yet under this subject.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {mods.map((m) => {
                    const card: Module = {
                      id: m.id,
                      code: subject.code,
                      subjectName: subject.name,
                      chapter: m.chapter,
                      title: m.title,
                      description: m.description ?? "",
                      progress: m.progress,
                      locked: false,
                      done: m.done,
                      attachments: m.attachments,
                    };
                    return (
                      <div key={m.id} className="relative group">
                        <ModuleCard
                          module={card}
                          onComplete={() => updateModule(m.id, { done: true, progress: 100 })}
                          onUploadFile={addModuleFile}
                          onRemoveFile={removeModuleFile}
                        />
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
      )}
    </DashboardShell>
  );
}
