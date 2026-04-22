/**
 * lib/scoring.ts
 *
 * Pure, isomorphic scoring heuristics used by both the backend AI matching engine
 * and the client-side Vibe Feed ranking algorithm.
 * Contains ZERO server-only dependencies (like OpenAI SDK or Supabase Admin clients).
 */

export interface FeedItemBase {
  id: string;
  makerId: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  makerVerified: boolean;
}

export interface MatchOptions {
  userHistory?: {
    likedIds: Set<string>;
    savedIds: Set<string>;
  };
  userCoords: { lat: number; lng: number } | null;
  targetRadius: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreHeuristic(
  item: FeedItemBase,
  options: MatchOptions
): number {
  let score = 0;

  if (options.userCoords && item.latitude !== null && item.longitude !== null) {
    const dist = haversineKm(
      options.userCoords.lat,
      options.userCoords.lng,
      item.latitude,
      item.longitude
    );
    score += 30 * (1 / (1 + dist / options.targetRadius));
  }

  if (item.makerVerified) score += 20;

  if (options.userHistory) {
    if (options.userHistory.savedIds.has(item.makerId)) score += 30;
    if (options.userHistory.likedIds.has(item.id)) score += 10;
  }

  const ageInDays =
    (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  score += 10 * Math.exp(-ageInDays / 14);

  return score;
}

const VECTOR_WEIGHT = 0.7;
const HEURISTIC_WEIGHT = 0.3;
const HEURISTIC_MAX = 100;

export function scoreDiscoveryMatch(
  item: FeedItemBase & { similarity?: number | null },
  options: MatchOptions
): number {
  const heuristic = scoreHeuristic(item, options);
  const normalizedHeuristic = heuristic / HEURISTIC_MAX;

  if (item.similarity != null) {
    return item.similarity * VECTOR_WEIGHT + normalizedHeuristic * HEURISTIC_WEIGHT;
  }

  return normalizedHeuristic;
}
