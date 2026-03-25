import { Redis } from '@upstash/redis'

let redisClient: Redis | null = null

try {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    redisClient = new Redis({ url, token })
  }
} catch {
  redisClient = null
}

export const redis = redisClient
