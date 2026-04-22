import { createClient } from "@/utils/supabase/client";

/**
 * Client-side message and conversation helpers for ShapaCV.
 * Uses the client Supabase SDK — safe to import from Client Components.
 */

export async function sendMessage(conversationId: string, text: string, attachmentUrl?: string, attachmentType?: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await (supabase.from("messages") as any)
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: text,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Update last_message in conversation
  await (supabase.from("conversations") as any)
    .update({
      last_message: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return data;
}

export async function createConversation(otherUserId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(user_1_id.eq.${user.id},user_2_id.eq.${otherUserId}),and(user_1_id.eq.${otherUserId},user_2_id.eq.${user.id})`)
    .single();

  if (existing) return existing;

  // Create new
  const { data, error } = await (supabase.from("conversations") as any)
    .insert({
      user_1_id: user.id,
      user_2_id: otherUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAsRead(conversationId: string, userId: string) {
  const supabase = createClient();
  const { error } = await (supabase.from("messages") as any)
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("is_read", false);
  
  if (error) {
    console.error("Failed to mark messages as read:", error);
    throw error;
  }
}
