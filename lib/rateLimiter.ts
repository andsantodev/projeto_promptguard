export interface RateLimits {
  maxPerHour: number;
  maxPerDay: number;
}

export interface TimestampStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RateLimitStatus {
  allowed: boolean;
  reason?: "hour" | "day";
  remainingInHour: number;
  remainingInDay: number;
}

export const DEFAULT_RATE_LIMITS: RateLimits = {
  maxPerHour: 3,
  maxPerDay: 10,
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const TOKEN_KEY = "promptg_session_token";
const auditsKey = (token: string) => `promptg_audits:${token}`;

export function getSessionToken(storage: TimestampStorage): string {
  const existing = storage.getItem(TOKEN_KEY);
  if (existing) return existing;
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(TOKEN_KEY, token);
  return token;
}

function readTimestamps(storage: TimestampStorage, token: string): number[] {
  const raw = storage.getItem(auditsKey(token));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === "number")
      : [];
  } catch {
    return [];
  }
}

export function checkRateLimit(
  storage: TimestampStorage,
  nowMs: number,
  limits: RateLimits = DEFAULT_RATE_LIMITS,
  token?: string
): RateLimitStatus {
  const t = token ?? getSessionToken(storage);
  const timestamps = readTimestamps(storage, t);

  const hourCount = timestamps.filter((ts) => nowMs - ts < HOUR_MS).length;
  const dayCount = timestamps.filter((ts) => nowMs - ts < DAY_MS).length;

  if (hourCount >= limits.maxPerHour) {
    return {
      allowed: false,
      reason: "hour",
      remainingInHour: 0,
      remainingInDay: Math.max(0, limits.maxPerDay - dayCount),
    };
  }

  if (dayCount >= limits.maxPerDay) {
    return {
      allowed: false,
      reason: "day",
      remainingInHour: Math.max(0, limits.maxPerHour - hourCount),
      remainingInDay: 0,
    };
  }

  return {
    allowed: true,
    remainingInHour: Math.max(0, limits.maxPerHour - hourCount),
    remainingInDay: Math.max(0, limits.maxPerDay - dayCount),
  };
}

export function recordAudit(
  storage: TimestampStorage,
  nowMs: number,
  token?: string
): void {
  const t = token ?? getSessionToken(storage);
  const timestamps = readTimestamps(storage, t);
  timestamps.push(nowMs);
  const pruned = timestamps.filter((ts) => nowMs - ts < DAY_MS);
  storage.setItem(auditsKey(t), JSON.stringify(pruned));
}