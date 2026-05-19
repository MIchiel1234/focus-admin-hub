import { directSupabase } from "@/lib/direct-supabase";

async function uid() {
  const { data } = await directSupabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  await uid();
  const { data, error } = await directSupabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
};

export const createNotification = async (input: { title: string; message?: string }) => {
  const user_id = await uid();
  const { data, error } = await directSupabase
    .from("notifications")
    .insert({ user_id, title: input.title, message: input.message ?? "" })
    .select("id, title, message, is_read, created_at")
    .single();
  if (error) throw error;
  return data as Notification;
};

export const markNotificationRead = async (id: string) => {
  const { error } = await directSupabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
};

export const markAllNotificationsRead = async () => {
  const user_id = await uid();
  const { error } = await directSupabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user_id)
    .eq("is_read", false);
  if (error) throw error;
};

export const deleteNotification = async (id: string) => {
  const { error } = await directSupabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
};
