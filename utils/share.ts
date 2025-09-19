// utils/share.ts
import { postgrest } from "@/lib/postgrest";

export async function getShareUrl(chatId: string): Promise<string> {
  const { data, error } = await postgrest
    .from("chat")
    .select("share_url") // or "response_file_url" if that’s what you use
    .eq("chatId", chatId)
    .single();

  if (error) throw error;

  return data.share_url;
}
