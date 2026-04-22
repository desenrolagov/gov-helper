type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_MAX_ENTRIES = 5000;
const store = new Map<string, RateLimitEntry>();

type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function cleanupExpiredEntries(now: number) {
  for (const [key, value] of store.entries()) {
    if (now > value.resetAt) {
      store.delete(key);
    }
  }

  if (store.size <= RATE_LIMIT_MAX_ENTRIES) {
    return;
  }

  const sortedEntries = [...store.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt
  );

  const excess = store.size - RATE_LIMIT_MAX_ENTRIES;

  for (let i = 0; i < excess; i++) {
    const entry = sortedEntries[i];
    if (entry) {
      store.delete(entry[0]);
    }
  }
}

export function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  cleanupExpiredEntries(now);

  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;

    store.set(key, {
      count: 1,
      resetAt,
    });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    success: true,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function buildRateLimitKey(prefix: string, request: Request): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${prefix}:${ip}:${userAgent.slice(0, 80)}`;
}

export function createRateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  ).toString();

  return new Response(
    JSON.stringify({
      error: "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter,
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}