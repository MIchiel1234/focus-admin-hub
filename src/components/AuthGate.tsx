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
  const { signInWithMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

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
  };

  const google = async () => {
    setGoogleBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleBusy(false);
      toast.error(error);
    }
    // On success the browser redirects to Google; no state to reset.
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
            <p className="text-xs text-muted-foreground">Google or magic link.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={google}
          disabled={googleBusy}
          className="mb-4 w-full"
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {googleBusy ? "Redirecting…" : "Continue with Google"}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-card px-2 text-muted-foreground">or email</span>
          </div>
        </div>

        {sent ? (
          <div className="rounded-lg border border-vibrant/30 bg-vibrant/5 p-4 text-sm">
            <Mail className="mb-2 h-4 w-4 text-vibrant-from" />
            Check <span className="font-medium">{email}</span> for a sign-in link.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z"/>
    </svg>
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
