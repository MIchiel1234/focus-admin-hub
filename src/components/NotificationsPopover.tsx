import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Plus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "@/lib/notifications.functions";
import { useAuth } from "@/lib/auth-store";

export function NotificationsPopover() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setItems(await getNotifications());
    } catch (err) {
      console.error("[notifications] load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const unread = items.filter((n) => !n.is_read).length;

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      const n = await createNotification({ title: title.trim() });
      setItems((prev) => [n, ...prev]);
      setTitle("");
    } catch (err) {
      toast.error("Could not add notification", { description: (err as Error).message });
    } finally {
      setAdding(false);
    }
  };

  const handleRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch (err) {
      toast.error("Could not update", { description: (err as Error).message });
    }
  };

  const handleAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      toast.error("Could not update", { description: (err as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (err) {
      toast.error("Could not delete", { description: (err as Error).message });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/30">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vibrant px-1 text-[10px] font-semibold text-primary-foreground shadow-vibrant">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button onClick={handleAllRead} className="text-xs text-muted-foreground hover:text-foreground">
              Mark all read
            </button>
          )}
        </div>

        {user ? (
          <>
            <div className="flex gap-2 border-b border-border p-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="New notification…"
                className="h-8 text-sm"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd} disabled={adding}>
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet</div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-2 border-b border-border/40 px-3 py-2 text-sm ${
                      n.is_read ? "opacity-70" : "bg-accent/10"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium leading-tight">{n.title}</div>
                      {n.message && <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                      {!n.is_read && (
                        <button
                          onClick={() => handleRead(n.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          title="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">Sign in to see notifications</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
