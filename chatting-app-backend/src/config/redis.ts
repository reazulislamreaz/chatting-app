import Redis from "ioredis";
import { env } from "./env";

let redis: Redis | null = null;

function needsTls(url: string): boolean {
  return (
    url.startsWith("rediss://") ||
    url.includes(".upstash.io")
  );
}

export function isRedisEnabled(): boolean {
  return env.REDIS_ENABLED && Boolean(env.REDIS_URL);
}

export function getRedis(): Redis {
  if (!isRedisEnabled()) {
    throw new Error("Redis is not enabled");
  }
  if (!redis) {
    const url = env.REDIS_URL!;
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      tls: needsTls(url) ? {} : undefined,
    });
    redis.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  if (!isRedisEnabled()) {
    console.log("[redis] disabled — set REDIS_URL and REDIS_ENABLED=true to enable");
    return;
  }
  try {
    const client = getRedis();
    await client.connect();
    await client.ping();
    console.log("[redis] connected");
  } catch (err) {
    redis = null;
    const message = err instanceof Error ? err.message : String(err);
    console.error("[redis] connection failed:", message);
    console.error("[redis] caching disabled — fix REDIS_URL in .env and restart");
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
