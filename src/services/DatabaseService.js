import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Redis from 'ioredis'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class DatabaseService {
  constructor(dbFilePath = path.join(__dirname, '../../database/db.data')) {
    this.dbPath = dbFilePath
    this.db = {
      users: {},
      groups: {},
      waifus: {},
      economy: {},
      gacha: {},
      cooldowns: {},
      guilds: {},
      seasons: [],
      plugins: {}
    }
    this.isDirty = false
    this.isSaving = false
    this.saveInterval = null
    this.redis = null
    this.shutdownHandled = false
    this.initRedis()
  }

  initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: t => (t > 3 ? null : Math.min(t * 200, 2000)),
        lazyConnect: true
      })

      client.once('connect', () => {
        this.redis = client
      })

      client.once('error', () => {
        client.disconnect()
        this.redis = null
      })

      client.connect().catch(() => {
        this.redis = null
      })
    } catch {
      this.redis = null
    }
  }

  async load() {
    try {
      const exists = fs.existsSync(this.dbPath)
      if (exists) {
        const raw = await fs.promises.readFile(this.dbPath, 'utf-8')
        this.db = JSON.parse(raw)
      } else {
        await this.save(true)
      }
    } catch {
      this.db = this.db
    }

    this.setupAutoSave()
    this.setupShutdownHooks()
    return this.db
  }

  setupAutoSave() {
    if (this.saveInterval) return
    this.saveInterval = setInterval(() => this.save(), 30000)
  }

  setupShutdownHooks() {
    const handler = async () => {
      if (this.shutdownHandled) return
      this.shutdownHandled = true
      await this.save(true)
      if (this.saveInterval) clearInterval(this.saveInterval)
      if (this.redis) this.redis.disconnect()
    }

    process.once('SIGINT', handler)
    process.once('SIGTERM', handler)
    process.once('exit', handler)
  }

  async save(force = false) {
    if ((!this.isDirty && !force) || this.isSaving) return
    this.isSaving = true

    try {
      const dir = path.dirname(this.dbPath)
      await fs.promises.mkdir(dir, { recursive: true })
      await fs.promises.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8')
      this.isDirty = false
    } catch {
    } finally {
      this.isSaving = false
    }
  }

  markDirty() {
    if (!this.isDirty) this.isDirty = true
  }

  async getCached(key) {
    if (!this.redis) return null
    try {
      const val = await this.redis.get(key)
      return val ? JSON.parse(val) : null
    } catch {
      return null
    }
  }

  async setCache(key, value, ttl = 300) {
    if (!this.redis) return
    try {
      const data = JSON.stringify(value)
      await this.redis.setex(key, ttl, data)
    } catch {}
  }

  async invalidateCache(key) {
    if (!this.redis) return
    try {
      await this.redis.del(key)
    } catch {}
  }

  createDefaultUser() {
    return {
      economy: {
        coins: 0,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
        lastCrime: 0,
        lastSlut: 0
      },
      gacha: {
        characters: [],
        lastClaim: 0,
        votes: {}
      },
      stats: {
        messages: 0,
        commands: 0
      },
      guild: null,
      season: null,
      monedas: 0,
      antirobo: 0,
      desbloqueo: 0
    }
  }

  createDefaultGroup() {
    return {
      settings: {
        antilink: false,
        welcome: false,
        economy: true,
        porn: false,
        alerts: false,
        aiModeration: false,
        moderationLevel: 'medium'
      },
      banned: []
    }
  }

  async getUser(userId) {
    const cacheKey = `user:${userId}`
    let user = await this.getCached(cacheKey)
    if (user) return user

    if (!this.db.users[userId]) {
      this.db.users[userId] = this.createDefaultUser()
      this.markDirty()
    }

    user = this.db.users[userId]
    await this.setCache(cacheKey, user)
    return user
  }

  updateUser(userId, updates) {
    const user = this.db.users[userId]
    if (!user) return null
    Object.assign(user, updates)
    this.markDirty()
    this.invalidateCache(`user:${userId}`)
    return user
  }

  async getGroup(groupId) {
    const cacheKey = `group:${groupId}`
    let group = await this.getCached(cacheKey)
    if (group) return group

    if (!this.db.groups[groupId]) {
      this.db.groups[groupId] = this.createDefaultGroup()
      this.markDirty()
    }

    group = this.db.groups[groupId]
    await this.setCache(cacheKey, group)
    return group
  }

  updateGroup(groupId, updates) {
    const group = this.db.groups[groupId]
    if (!group) return null
    Object.assign(group, updates)
    this.markDirty()
    this.invalidateCache(`group:${groupId}`)
    return group
  }

  async getLeaderboard(season = null, limit = 10) {
    const cacheKey = `leaderboard:${season || 'all'}:${limit}`
    const cached = await this.getCached(cacheKey)
    if (cached) return cached

    const data = Object.entries(this.db.users)
      .filter(([_, u]) => !season || u.season === season)
      .map(([id, u]) => ({
        id,
        coins: (u.economy?.coins || 0) + (u.economy?.bank || 0),
        level: u.level || 1
      }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, limit)

    await this.setCache(cacheKey, data, 60)
    return data
  }

  createSeason(name, startDate, endDate, rewards) {
    const season = {
      id: Date.now(),
      name,
      startDate,
      endDate,
      active: true,
      rewards
    }

    this.db.seasons.forEach(s => (s.active = false))
    this.db.seasons.push(season)
    this.markDirty()
    return season
  }
}
