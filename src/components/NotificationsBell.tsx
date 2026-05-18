import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStudy } from "@/lib/study-store";

interface Notif {
  id: string;
  title: string;
  body: string;
  tone: "overdue" | "soon" | "upcoming";
}

const DISMISSED_KEY = "notif:dismissed:v1";

function loadDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveDismissed(s: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
}

export function NotificationsBell() {
  const { goals } = useStudy();
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : loadDismissed()
  );

  const notifs = useMemo<Notif[]>(() => {
    const now = Date.now();
    const out: Notif[] = [];
    for (const g of goals) {
      if (g.is_done || !g.due_date) continue;
      const due = new Date(g.due_date).getTime();
      const days = Math.ceil((due - now) / 86400000);
      if (days > 7) continue;
      let tone: Notif["tone"] = "upcoming";
      let body = `Due in ${days} days`;
      if (days < 0) {
        tone = "overdue";
        body = `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
      } else if (days === 0) {
        tone = "soon";
        body = "Due today";
      } else if (days <= 2) {
        tone = "soon";
        body = `Due in ${days} day${days === 1 ? "" : "s"}`;
      }
      out.push({ id: g.id, title: g.title, body, tone });
    }
    return out
      .filter((n) => !dismissed.has(n.id))
      .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "overdue" ? -1 : 1));
  }, [goals, dismissed]);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/30">
          <Bell className="h-4 w-4" />
          {notifs.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {notifs.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-sm font-semibold">Notifications</div>
        {notifs.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifs.map((n) => (
              <NotifItem key={n.id} notif={n} onDismiss={() => dismiss(n.id)} />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotifItem({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const [dx, setDx] = useState(0);
  const [removing, setRemoving] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!removing) return;
    const t = setTimeout(onDismiss, 200);
    return () => clearTimeout(t);
  }, [removing, onDismiss]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    const width = ref.current?.offsetWidth ?? 320;
    if (Math.abs(dx) > width * 0.35) {
      setDx(dx > 0 ? width : -width);
      setRemoving(true);
    } else {
      setDx(0);
    }
  };

  const toneClass =
    notif.tone === "overdue"
      ? "border-l-destructive"
      : notif.tone === "soon"
      ? "border-l-vibrant"
      : "border-l-primary";

  return (
    <li
      ref={ref}
      className="relative select-none border-b border-border last:border-b-0"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className={`flex items-start gap-2 border-l-4 ${toneClass} bg-background px-3 py-2.5 transition-transform ${
          startX.current === null ? "duration-200" : "duration-0"
        }`}
        style={{ transform: `translateX(${dx}px)`, opacity: removing ? 0 : 1 - Math.min(Math.abs(dx) / 300, 0.6) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{notif.title}</div>
          <div className="text-xs text-muted-foreground">{notif.body}</div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent/30 hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
