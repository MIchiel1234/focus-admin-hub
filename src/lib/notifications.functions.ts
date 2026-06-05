import { supabase } from "@/integrations/supabase/client";

async function uid() {
  const { data } = await supabase.auth.getUser();
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
  const user_id = await uid();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, is_read, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).filter((n: any) => n.user_id === user_id).map(({ user_id: _userId, ...notification }: any) => notification) as Notification[];
};

export const createNotification = async (input: { title: string; message?: string }) => {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id, title: input.title, message: input.message ?? "" })
    .select("id, title, message, is_read, created_at")
    .single();
  if (error) throw error;
  return data as Notification;
};

export const markNotificationRead = async (id: string) => {
  const user_id = await uid();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user_id);
  if (error) throw error;
};

export const markAllNotificationsRead = async () => {
  const user_id = await uid();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user_id)
    .eq("is_read", false);
  if (error) throw error;
};

export const deleteNotification = async (id: string) => {
  const user_id = await uid();
  const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", user_id);
  if (error) throw error;
};
