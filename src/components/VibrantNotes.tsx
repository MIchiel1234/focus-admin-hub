import { useEffect, useRef, useState } from "react";
import { NotebookPen, Paperclip, Plus, Trash2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import {
  createNote,
  deleteNote,
  getNotes,
  uploadNoteFile,
  getNoteFileUrl,
  type NoteAttachment,
} from "@/lib/notes.functions";

interface Note {
  id: string;
  title: string;
  body: string;
  date: string;
  attachments: NoteAttachment[];
}

export function VibrantNotes() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<NoteAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setNotes([]);
    if (!user) return;
    getNotes()
      .then((n) => !cancelled && setNotes(n as Note[]))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, user?.id]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const uploaded: NoteAttachment[] = [];
      for (const f of Array.from(files)) {
        uploaded.push(await uploadNoteFile(f));
      }
      setPending((p) => [...p, ...uploaded]);
    } catch (e: any) {
      alert("Upload failed: " + (e?.message ?? e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addNote = async () => {
    if (!title.trim() && !body.trim() && pending.length === 0) return;
    if (!user) return;
    const next = await createNote({
      data: { title: title.trim() || "Untitled", body: body.trim(), attachments: pending },
    });
    setNotes([next as Note, ...notes]);
    setTitle("");
    setBody("");
    setPending([]);
  };

  const removeNote = async (id: string) => {
    setNotes(notes.filter((x) => x.id !== id));
    if (user) await deleteNote({ data: { id } });
  };

  const openAttachment = async (path: string) => {
    try {
      const url = await getNoteFileUrl(path);
      window.open(url, "_blank");
    } catch (e: any) {
      alert("Could not open file: " + (e?.message ?? e));
    }
  };

  const fmtSize = (n: number) =>
    n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

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

        {pending.length > 0 && (
          <ul className="mt-2 space-y-1">
            {pending.map((a) => (
              <li
                key={a.path}
                className="flex items-center justify-between rounded-md border border-border bg-background/60 px-2 py-1 text-xs"
              >
                <span className="truncate">
                  <Paperclip className="mr-1 inline h-3 w-3" />
                  {a.name} <span className="text-muted-foreground">({fmtSize(a.size)})</span>
                </span>
                <button
                  onClick={() => setPending((p) => p.filter((x) => x.path !== a.path))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !user}
          >
            <Paperclip className="mr-1 h-4 w-4" />
            {uploading ? "Uploading…" : "Attach files"}
          </Button>
          <Button
            onClick={addNote}
            disabled={!user || uploading}
            className="bg-vibrant text-primary-foreground border-0 shadow-vibrant hover:opacity-90"
          >
            <Plus className="mr-1 h-4 w-4" /> Save note
          </Button>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {notes.map((n) => (
          <li
            key={n.id}
            className="group rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{n.title}</h3>
                {n.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                )}
                {n.attachments?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {n.attachments.map((a) => (
                      <li key={a.path}>
                        <button
                          onClick={() => openAttachment(a.path)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1 text-xs hover:border-primary/40"
                        >
                          <Download className="h-3 w-3" />
                          {a.name}
                          <span className="text-muted-foreground">({fmtSize(a.size)})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
