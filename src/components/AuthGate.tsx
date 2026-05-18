import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await signInWithMagicLink(email.trim());
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("Magic link sent. Check your email.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vibrant shadow-vibrant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
            <p className="text-xs text-muted-foreground">Use your email magic link.</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-lg border border-vibrant/30 bg-vibrant/5 p-4 text-sm">
            <Mail className="mb-2 h-4 w-4 text-vibrant-from" />
            Check <span className="font-medium">{email}</span> for a sign-in link.
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-vibrant text-primary-foreground border-0 shadow-vibrant"
              >
                {busy ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function SignOutButton() {
  const { signOut, user } = useAuth();
  if (!user) return null;
  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      title={user.email ?? "Sign out"}
    >
      <LogOut className="h-3 w-3" /> Sign out
    </button>
  );
}
