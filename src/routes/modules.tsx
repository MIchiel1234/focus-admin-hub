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
  const { modules, chapterViews, addModule, addChapter, removeChapter, completeChapter } = useStudy();
  const [openModule, setOpenModule] = useState(false);
  const [openChapter, setOpenChapter] = useState(false);

  // Module form
  const [modCode, setModCode] = useState("");
  const [modTitle, setModTitle] = useState("");

  // Chapter form
  const [chModule, setChModule] = useState<string>(modules[0]?.id ?? "");
  const [chNumber, setChNumber] = useState("");
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");

  const grouped = useMemo(() => {
    return modules.map((m) => ({
      module: m,
      chapters: chapterViews.filter((c) => c.moduleId === m.id),
    }));
  }, [modules, chapterViews]);

  const submitModule = async () => {
    if (!modCode.trim() || !modTitle.trim()) return;
    try {
      await addModule({
        code: modCode.trim().toUpperCase().slice(0, 20),
        title: modTitle.trim().slice(0, 100),
      });
      setModCode(""); setModTitle(""); setOpenModule(false);
      toast.success("Module added");
    } catch (e) { toast.error((e as Error).message); }
  };

  const submitChapter = async () => {
    const num = parseInt(chNumber, 10);
    if (!chModule || !num || !chTitle.trim()) return;
    try {
      await addChapter({
        module_id: chModule,
        chapter_number: num,
        title: chTitle.trim().slice(0, 100),
        description: chDesc.trim().slice(0, 300),
      });
      setChNumber(""); setChTitle(""); setChDesc(""); setOpenChapter(false);
      toast.success("Chapter added");
    } catch (e) { toast.error((e as Error).message); }
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
          <Dialog open={openModule} onOpenChange={setOpenModule}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Module</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a module</DialogTitle>
                <DialogDescription>Create a new module (e.g. TAX3761).</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="s-code">Code</Label>
                  <Input id="s-code" value={modCode} onChange={(e) => setModCode(e.target.value)} placeholder="TAX3761" maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="s-name">Title</Label>
                  <Input id="s-name" value={modTitle} onChange={(e) => setModTitle(e.target.value)} placeholder="Taxation of Business Activities" maxLength={100} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitModule} className="bg-vibrant text-primary-foreground border-0">Add module</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openChapter} onOpenChange={(o) => { setOpenChapter(o); if (o && !chModule) setChModule(modules[0]?.id ?? ""); }}>
            <DialogTrigger asChild>
              <Button className="bg-vibrant text-primary-foreground border-0 shadow-vibrant"><Plus className="mr-2 h-4 w-4" /> Chapter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a chapter</DialogTitle>
                <DialogDescription>Add a chapter to a module.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Module</Label>
                  <Select value={chModule} onValueChange={setChModule}>
                    <SelectTrigger><SelectValue placeholder="Pick a module" /></SelectTrigger>
                    <SelectContent>
                      {modules.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.code} — {m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="m-num">Chapter number</Label>
                  <Input id="m-num" type="number" min={1} value={chNumber} onChange={(e) => setChNumber(e.target.value)} placeholder="7" />
                </div>
                <div>
                  <Label htmlFor="m-title">Title</Label>
                  <Input id="m-title" value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="VAT" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="m-desc">Description</Label>
                  <Input id="m-desc" value={chDesc} onChange={(e) => setChDesc(e.target.value)} placeholder="Short summary" maxLength={300} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitChapter} disabled={!chModule} className="bg-vibrant text-primary-foreground border-0">Add chapter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-10">
        {grouped.map(({ module: m, chapters }) => (
          <section key={m.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {m.code} · <span className="text-foreground/80 normal-case tracking-normal">{m.title}</span>
              </h2>
              <span className="text-xs text-muted-foreground">{chapters.length} chapter{chapters.length === 1 ? "" : "s"}</span>
            </div>
            {chapters.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No chapters yet. Click "Chapter" to add one.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {chapters.map((c) => {
                  const card: Module = {
                    id: c.id,
                    code: c.moduleCode,
                    chapter: `Chapter ${c.chapterNumber}`,
                    title: c.title,
                    description: c.description,
                    progress: c.progress,
                    locked: c.locked,
                    done: c.done,
                    unlockHint: c.unlockHint,
                  };
                  return (
                    <div key={c.id} className="relative group">
                      <ModuleCard module={card} onComplete={() => completeChapter(c.id).catch((e) => toast.error((e as Error).message))} />
                      <button
                        onClick={() => removeChapter(c.id).catch((e) => toast.error((e as Error).message))}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                        title="Delete chapter"
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
