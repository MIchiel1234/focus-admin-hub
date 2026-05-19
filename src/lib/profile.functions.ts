import { directSupabase } from "@/lib/direct-supabase";

async function uid() {
  const { data } = await directSupabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export const getMyProfile = async (): Promise<Profile | null> => {
  const user_id = await uid();
  const { data, error } = await directSupabase
    .from("profiles")
    .select("id, user_id, display_name, avatar_url, bio")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;
  // Fallback insert if trigger didn't run
  const { data: created, error: insertError } = await directSupabase
    .from("profiles")
    .insert({ user_id })
    .select("id, user_id, display_name, avatar_url, bio")
    .single();
  if (insertError) throw insertError;
  return created as Profile;
};

export const updateMyProfile = async (input: {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}) => {
  const user_id = await uid();
  const { data, error } = await directSupabase
    .from("profiles")
    .update(input)
    .eq("user_id", user_id)
    .select("id, user_id, display_name, avatar_url, bio")
    .single();
  if (error) throw error;
  return data as Profile;
};
