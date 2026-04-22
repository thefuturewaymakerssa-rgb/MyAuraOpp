import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Admin Chat Surveillance API
 * Retrieves conversation messages between two users for dispute review.
 *
 * Security:
 * 1. JWT auth via Authorization: Bearer token
 * 2. Role check: caller must have role = 'admin'
 * 3. Zod schema validation on request body
 *
 * POST /api/admin/disputes/chat
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Input Schema ─────────────────────────────────────────────
const ChatSchema = z.object({
  user1Id: z.string().uuid('user1Id must be a valid UUID'),
  user2Id: z.string().uuid('user2Id must be a valid UUID'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Admin role check
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      logger.warn('[Admin:Chat] Non-admin access attempt', { userId: user.id });
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // 3. Zod validation
    const body = await req.json();
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { user1Id, user2Id } = parsed.data;

    // 4. Find conversation between the two users (check both orderings)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`and(user_1_id.eq.${user1Id},user_2_id.eq.${user2Id}),and(user_1_id.eq.${user2Id},user_2_id.eq.${user1Id})`)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ messages: [], info: "No conversation found between these parties." });
    }

    // 5. Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    logger.info('[Admin:Chat] Surveillance request', { adminId: user.id, user1Id, user2Id, messageCount: messages?.length ?? 0 });

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages || []
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Admin Chat Surveillance API Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
