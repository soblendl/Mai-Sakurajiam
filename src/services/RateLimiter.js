import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'
import CircuitBreaker from 'opossum'
import Redis from 'ioredis'

export class RateLimiter {
  constructor() {
    this.limiters = {}
    this.circuitBreakers = {}
    this.redis = null
    this.initLimiters()
    this.initCircuitBreakers()
  }

  initLimiters() {
    try {
      const redisUrl = process.env.REDIS_URL
      if (redisUrl) {
        this.redis = new Redis(redisUrl, { enableOfflineQueue: false })

        this.limiters.commands = new RateLimiterRedis({
          storeClient: this.redis,
          keyPrefix: 'rl:cmd',
          points: 10,
          duration: 10,
          blockDuration: 30
        })

        this.limiters.economy = new RateLimiterRedis({
          storeClient: this.redis,
          keyPrefix: 'rl:eco',
          points: 5,
          duration: 60,
          blockDuration: 120
        })
      } else {
        this.limiters.commands = new RateLimiterMemory({
          points: 10,
          duration: 10,
          blockDuration: 30
        })

        this.limiters.economy = new RateLimiterMemory({
          points: 5,
          duration: 60,
          blockDuration: 120
        })
      }
    } catch {
      this.limiters.commands = new RateLimiterMemory({
        points: 10,
        duration: 10,
        blockDuration: 30
      })

      this.limiters.economy = new RateLimiterMemory({
        points: 5,
        duration: 60,
        blockDuration: 120
      })
    }
  }

  initCircuitBreakers() {
    const options = {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    }

    this.circuitBreakers.scraper = new CircuitBreaker(
      async () => null,
      options
    )

    this.circuitBreakers.api = new CircuitBreaker(
      async () => null,
      options
    )
  }

  async checkCommandLimit(userId) {
    try {
      await this.limiters.commands.consume(userId)
      return { allowed: true }
    } catch (e) {
      if (e.msBeforeNext !== undefined) {
        const wait = Math.ceil(e.msBeforeNext / 1000)
        return {
          allowed: false,
          retryAfter: wait,
          message: `Límite de comandos alcanzado. Espera ${wait}s`
        }
      }
      throw e
    }
  }

  async checkEconomyLimit(userId) {
    try {
      await this.limiters.economy.consume(userId)
      return { allowed: true }
    } catch (e) {
      if (e.msBeforeNext !== undefined) {
        const wait = Math.ceil(e.msBeforeNext / 1000)
        return {
          allowed: false,
          retryAfter: wait,
          message: `Límite de acciones económicas alcanzado. Espera ${wait}s`
        }
      }
      throw e
    }
  }

  async executeWithCircuitBreaker(type, fn, ...args) {
    const breaker = this.circuitBreakers[type]
    if (!breaker) return fn(...args)

    try {
      return await breaker.fire(fn, ...args)
    } catch (e) {
      if (e.message === 'Breaker is open') {
        throw new Error(`Servicio ${type} temporalmente no disponible`)
      }
      throw e
    }
  }

  getStats() {
    const stats = {}
    for (const [name, breaker] of Object.entries(this.circuitBreakers)) {
      stats[name] = {
        isOpen: breaker.opened,
        isHalfOpen: breaker.halfOpen,
        stats: breaker.status.stats
      }
    }
    return stats
  }
}
