import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function VibrantNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) toast.error("Failed to load notes");
      else setNotes(data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addNote = async () => {
    if (!user) {
      toast.error("Please sign in to save notes");
      return;
    }
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: title.trim() || "Untitled",
        body: body.trim(),
      })
      .select("id, title, body, created_at")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Failed to save note");
      return;
    }
    setNotes((prev) => [data, ...prev]);
    setTitle("");
    setBody("");
  };

  const removeNote = async (id: string) => {
    if (!user) return;
    const prev = notes;
    setNotes(notes.filter((x) => x.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Failed to delete note");
      setNotes(prev);
    }
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
          <Button
            onClick={addNote}
            disabled={saving}
            className="bg-vibrant text-primary-foreground border-0 shadow-vibrant hover:opacity-90"
          >
            <Plus className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {loading && <li className="text-sm text-muted-foreground">Loading notes…</li>}
        {!loading && notes.length === 0 && (
          <li className="text-sm text-muted-foreground">No notes yet — write your first win above.</li>
        )}
        {notes.map((n) => (
          <li key={n.id} className="group rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">{formatDate(n.created_at)}</p>
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
