import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import { createNote, deleteNote, getNotes } from "@/lib/notes.functions";

interface Note {
  id: string;
  title: string;
  body: string;
  date: string;
}

export function VibrantNotes() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setNotes([]);
    if (!user) return;
    getNotes()
      .then((nextNotes) => {
        if (!cancelled) setNotes(nextNotes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, user?.id]);

  const addNote = async () => {
    if (!title.trim() && !body.trim()) return;
    const nextNote = user
      ? await createNote({ data: { title: title.trim() || "Untitled", body: body.trim() } })
      : {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled",
        body: body.trim(),
        date: new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      };
    setNotes([nextNote, ...notes]);
    setTitle("");
    setBody("");
  };

  const removeNote = async (id: string) => {
    setNotes(notes.filter((x) => x.id !== id));
    if (user) await deleteNote({ data: { id } });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vibrant shadow-vibrant">
          <NotebookPen className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Vibrant Notes</h2>
          <p className="text-xs text-muted-foreground">Weekly accomplishments & wins</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-background/40 p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="This week I…"
          className="mb-2 border-0 bg-transparent text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Jot down what you accomplished, what clicked, what to revisit…"
          className="min-h-[90px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={addNote} className="bg-vibrant text-primary-foreground border-0 shadow-vibrant hover:opacity-90">
            <Plus className="mr-1 h-4 w-4" /> Save note
          </Button>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="group rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">{n.date}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeNote(n.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
