// lib/rate-limit.ts
import Redis from 'ioredis';

interface RateLimitConfig {
  maxRequests?: number;  // Maximum requests per window
  window?: number;       // Time window in seconds
  identifier?: string;   // Custom prefix for Redis keys
}

class MemoryStore {
  private store: Map<string, number[]>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<number[]> {
    return this.store.get(key) || [];
  }

  async set(key: string, value: number[], ttl: number): Promise<void> {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), ttl * 1000);
  }
}

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const memoryStore = new MemoryStore();

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = {}
) {
  const {
    maxRequests = 5,
    window = 60,
    identifier: prefix = 'rate-limit'
  } = config;

  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - (window * 1000);

  try {
    let timestamps: number[];

    if (redis) {
      // Using Redis
      const stored = await redis.get(key);
      timestamps = stored ? JSON.parse(stored) : [];
    } else {
      // Using memory store
      timestamps = await memoryStore.get(key);
    }

    // Remove old timestamps
    timestamps = timestamps.filter(time => time > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: Math.ceil((timestamps[0] - windowStart) / 1000)
      };
    }

    // Add new timestamp
    timestamps.push(now);

    // Store updated timestamps
    if (redis) {
      await redis.set(key, JSON.stringify(timestamps), 'EX', window);
    } else {
      await memoryStore.set(key, timestamps, window);
    }

    return {
      success: true,
      remaining: maxRequests - timestamps.length,
      reset: window
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if rate limiting fails
    return { success: true, remaining: -1, reset: -1 };
  }
}

// Example usage:
/*
const result = await rateLimit('user@example.com', {
  maxRequests: 5,    // 5 requests
  window: 60,        // per minute
  identifier: 'registration'
});

if (!result.success) {
  throw new Error(`Rate limit exceeded. Try again in ${result.reset} seconds`);
}
*/