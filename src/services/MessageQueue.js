import Queue from 'bull'

export class MessageQueue {
  constructor() {
    this.queues = {}
    this.enabled = false
    this.initQueue()
  }

  initQueue() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

      const config = {
        redis: redisUrl,
        settings: {
          maxRetriesPerRequest: null,
          enableReadyCheck: false
        }
      }

      this.queues.commands = new Queue('commands', config)
      this.queues.messages = new Queue('messages', config)
      this.queues.jobs = new Queue('scheduled-jobs', config)

      this.setupProcessors()
      this.enabled = true
    } catch {
      this.enabled = false
    }
  }

  setupProcessors() {
    this.queues.commands.process(async job => {
      const { ctx, plugin, command } = job.data
      await plugin.execute(ctx)
      return { success: true, command }
    })

    this.queues.messages.process(async job => {
      const { message, handlers } = job.data
      for (const handler of handlers) {
        await handler(message)
      }
      return { processed: true }
    })

    this.queues.jobs.process(async job => {
      const { type } = job.data
      return { completed: true, type }
    })
  }

  async addCommand(ctx, plugin, command, priority = 0) {
    if (!this.enabled) {
      await plugin.execute(ctx)
      return null
    }

    try {
      const job = await this.queues.commands.add(
        { ctx, plugin, command },
        {
          priority,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        }
      )
      return job.id
    } catch {
      await plugin.execute(ctx)
      return null
    }
  }

  async addMessage(message, handlers, priority = 0) {
    if (!this.enabled) {
      for (const handler of handlers) {
        await handler(message)
      }
      return null
    }

    try {
      const job = await this.queues.messages.add(
        { message, handlers },
        { priority }
      )
      return job.id
    } catch {
      for (const handler of handlers) {
        await handler(message)
      }
      return null
    }
  }

  async scheduleJob(type, data, delay) {
    if (!this.enabled) return null

    try {
      const job = await this.queues.jobs.add(
        { type, data },
        { delay }
      )
      return job.id
    } catch {
      return null
    }
  }

  async getQueueStats() {
    if (!this.enabled) return { enabled: false }

    const stats = {}

    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ])
        stats[name] = { waiting, active, completed, failed }
      } catch {
        stats[name] = { error: true }
      }
    }

    return { enabled: true, queues: stats }
  }

  async cleanOldJobs(hoursAgo = 24) {
    if (!this.enabled) return

    const ms = hoursAgo * 3600 * 1000
    for (const queue of Object.values(this.queues)) {
      try {
        await queue.clean(ms, 'completed')
        await queue.clean(ms, 'failed')
      } catch {}
    }
  }
}
