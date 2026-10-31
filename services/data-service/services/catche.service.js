// data-service/services/cache.service.js

import IORedis from "ioredis";

const redis = new IORedis(
  process.env.REDIS_URL,
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
);

const PREFIX = "cache:";

export async function getCache(key) {
  const value =
    await redis.get(`${PREFIX}${key}`);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function setCache(
  key,
  value,
  ttlSeconds = 60
) {
  await redis.set(
    `${PREFIX}${key}`,
    JSON.stringify(value),
    "EX",
    ttlSeconds
  );
}

export async function deleteCache(key) {
  await redis.del(
    `${PREFIX}${key}`
  );
}

export async function deleteCacheByPattern(
  pattern
) {
  let cursor = "0";

  do {
    const [nextCursor, keys] =
      await redis.scan(
        cursor,
        "MATCH",
        `${PREFIX}${pattern}`,
        "COUNT",
        100
      );

    cursor = nextCursor;

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}