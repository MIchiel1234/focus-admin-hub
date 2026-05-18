import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";

export function AuthPanel() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email.trim() || password.length < 6) return;
    const result = mode === "sign-in" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setMessage(result.error ?? result.message ?? "");
  };

  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="text-lg font-semibold">Sign in to save with Lovable Cloud</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your modules, goals, notes, and calendar stay available on every device.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_auto_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" />
          </div>
          <Button onClick={submit} className="bg-vibrant text-primary-foreground border-0 shadow-vibrant">
            <LogIn className="h-4 w-4" /> {mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
          <Button variant="outline" onClick={signInWithGoogle}>Google</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="underline-offset-4 hover:text-foreground hover:underline">
          {mode === "sign-in" ? "Create an account" : "Already have an account?"}
        </button>
        {message && <span>{message}</span>}
      </div>
    </section>
  );
}