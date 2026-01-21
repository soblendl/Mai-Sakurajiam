import { parentPort } from 'worker_threads'
import fs from 'fs'
import path from 'path'

const replacer = (() => {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return
      seen.add(value)
    }
    return value
  }
})()

parentPort.on('message', async (task) => {
  let id
  try {
    if (!task || typeof task !== 'object') return
    const { type, data } = task
    id = task.id
    if (!id) return

    switch (type) {
      case 'save': {
        if (!data || !data.dbPath || !data.collections) {
          parentPort.postMessage({ id, success: false, error: 'invalid_data' })
          return
        }

        const { dbPath, collections } = data

        await fs.promises.mkdir(dbPath, { recursive: true })

        const names = []
        for (const [name, items] of Object.entries(collections)) {
          const filePath = path.join(dbPath, `${name}.json`)
          await fs.promises.writeFile(
            filePath,
            JSON.stringify(items, replacer, 2)
          )
          names.push(name)
        }

        parentPort.postMessage({
          id,
          success: true,
          collections: names
        })
        break
      }

      default:
        parentPort.postMessage({ id, success: false, error: 'unknown_task' })
    }
  } catch (err) {
    try {
      parentPort.postMessage({
        id,
        success: false,
        error: err?.message || 'worker_error'
      })
    } catch {}
  }
})
