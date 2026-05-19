import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { getMyProfile, updateMyProfile, type Profile } from "@/lib/profile.functions";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Admin" }] }),
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setDisplayName(p?.display_name ?? "");
        setAvatarUrl(p?.avatar_url ?? "");
        setBio(p?.bio ?? "");
      })
      .catch((err) => toast.error("Could not load profile", { description: (err as Error).message }))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      });
      setProfile(updated);
      toast.success("Profile saved");
    } catch (err) {
      toast.error("Could not save", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-vibrant">Your Profile</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Manage how you show up across the dashboard.</p>
      </div>

      {!user && !authLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
          Sign in to view and edit your profile.
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-vibrant shadow-vibrant">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-7 w-7 text-primary-foreground" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">{displayName || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short blurb about you" rows={4} />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="bg-vibrant text-primary-foreground border-0 shadow-vibrant">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
