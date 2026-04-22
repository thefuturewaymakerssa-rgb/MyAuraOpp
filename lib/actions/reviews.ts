import { createClient } from "@/utils/supabase/client";

/**
 * Client-side review helpers for ShapaCV.
 * Uses the client Supabase SDK — safe to import from Client Components.
 */

export async function submitReview(payload: {
  maker_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
}) {
  const supabase = createClient();

  const { data, error } = await (supabase as any)
    .from("reviews")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error submitting review:", error.message, error.code);
    throw new Error(error.message);
  }

  return data;
}

export async function getReviews(makerId: string) {
  const supabase = createClient();

  // 1. Fetch reviews
  const { data: reviews, error } = await (supabase as any)
    .from("reviews")
    .select("*")
    .eq("maker_id", makerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error.message, error.code);
    return [];
  }

  if (!reviews || reviews.length === 0) return [];

  // 2. Extract unique reviewer IDs
  const reviewerIds = Array.from(new Set((reviews as any[]).map((r: any) => r.reviewer_id)));

  // 3. Fetch reviewer names from profiles table (all users live in profiles)
  const { data: makers, error: makersError } = await (supabase as any)
    .from("profiles")
    .select("id, name")
    .in("id", reviewerIds);

  if (makersError) {
    console.error("Error fetching reviewer names:", makersError.message);
    // Continue anyway, names will fallback to Anonymous in UI
  }

  // 4. Map names back to reviews
  const nameMap = new Map((makers as any[] || []).map((m: any) => [m.id, m.name]));

  const reviewsWithReviewers = (reviews as any[]).map((review: any) => ({
    ...review,
    reviewer: {
      name: nameMap.get(review.reviewer_id) || "Anonymous"
    }
  }));

  return reviewsWithReviewers;
}
