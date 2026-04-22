import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rateLimit";
import { Database } from "@/lib/database.types";
import { logger, generateTraceId } from "@/lib/logger";
import { transcribeAndEmbedProof } from "@/lib/transcription";

// Use the service-role key for server-side uploads so we bypass RLS
const supabaseAdmin = supabaseCreateClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn("SUPABASE_SERVICE_ROLE_KEY missing — upload API running with anon key (RLS applies)", {
    action: "upload.config.warn",
  });
}

export async function POST(req: NextRequest) {
  const traceId = generateTraceId();
  const uploadStart = Date.now();

  try {
    // 1. Authenticate
    const supabaseClientEarly = await createClient();
    let userId: string | null = null;
    try {
      const { data: { user: earlyUser } } = await supabaseClientEarly.auth.getUser();
      userId = earlyUser?.id ?? null;
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid session." }, { status: 401 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit
    let rateLimitResult;
    try {
      rateLimitResult = await uploadRateLimiter.limit(userId);
    } catch {
      logger.warn("Upload rate limiter unavailable — failing open", { action: "upload.ratelimit.fail", userId, traceId });
      rateLimitResult = { success: true, limit: 8, remaining: 7, reset: Date.now() + 3600000 };
    }

    const { success, limit, remaining, reset } = rateLimitResult;

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Upload rate limit reached. You have used all 8 uploads this hour.",
          remaining: 0,
          resetTime: new Date(reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Validate MIME type and size (max 100 MB)
    const mimeType = file.type.split(";")[0];
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Only video files (MP4, WebM, MOV, AVI) are allowed. Received: ${file.type}` },
        { status: 400 }
      );
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 100MB limit." }, { status: 400 });
    }

    // 5. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = (file.name || "recording.webm").split(".").pop()?.toLowerCase() || "webm";
    const validExts = ["mp4", "webm", "mov", "avi"];
    const finalExt = validExts.includes(ext) ? ext : "webm";

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${finalExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("proofs")
      .upload(filePath, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      logger.error("Supabase storage upload failed", error, {
        action: "upload.storage.fail",
        userId,
        traceId,
        mimeType,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("proofs").getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;

    logger.info("Video uploaded successfully", {
      action: "upload.success",
      userId,
      traceId,
      durationMs: Date.now() - uploadStart,
      filePath: data.path,
      fileSizeBytes: file.size,
    });

    // 6. Fire-and-forget: transcription + embedding pipeline
    // Runs asynchronously — never blocks the upload response.
    // "pending" as proofId because the proof DB row is created at publish time (not upload time).
    void transcribeAndEmbedProof("pending", publicUrl, userId);

    // 7. Respond
    const response = NextResponse.json({
      url: publicUrl,
      path: filePath,
      remainingUploads: remaining,
    });
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    response.headers.set("X-Trace-Id", traceId);
    return response;

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Upload route unhandled error", error, { action: "upload.error", traceId });
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
