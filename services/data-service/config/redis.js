// data-service/config/redis.js

import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required.");
}

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    console.log(`Redis reconnect attempt: ${times}`);
    if (times > 20) {
      console.error("Redis: जास्त attempts झाले, थांबतो.");
      return null; // retry बंद करा
    }
    return Math.min(times * 500, 3000); // 0.5s, 1s, 1.5s... max 3s
  },
  reconnectOnError: (err) => {
    console.error("Redis reconnect on error:", err.message);
    return true;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

redis.on("error", (error) => {
  console.error("❌ Redis error:", error.message);
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});