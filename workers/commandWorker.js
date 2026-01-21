import { downloadContentFromMessage } from '@imjxsx/wapi'
import { styleText, styleMessage } from '../lib/utils.js'
import { ERRORS } from '../lib/constants.js'

export function setupCommandWorker(bot, services) {
  const queue = services.queueManager.getQueue('commandQueue')

  queue.process(async (job) => {
    try {
      const { commandName, ctxData } = job.data
      const name = commandName?.toLowerCase().trim()
      const commandData = global.commandMap.get(name)
      if (!commandData) return

      const baseStyled = styleMessage(ctxData.msg?.pushName || 'Usuario', ctxData.text)

      const replyBuilder = async (payload, options = {}) => {
        if (payload?.caption) {
          payload.caption = `${baseStyled}\n\n${payload.caption}`
        } else if (payload?.text) {
          payload.text = `${baseStyled}\n\n${payload.text}`
        }
        return bot.ws.sendMessage(ctxData.chatId, payload, { quoted: ctxData.msg })
      }

      const ctx = {
        ...services,
        ...ctxData,
        bot: {
          sendMessage: (jid, content, options) => bot.ws.sendMessage(jid, content, options),
          sock: bot.ws,
          groupMetadata: (jid) => bot.ws.groupMetadata(jid),
          groupParticipantsUpdate: (jid, participants, action) =>
            bot.ws.groupParticipantsUpdate(jid, participants, action)
        },
        reply: (text, options = {}) => replyBuilder({ text, ...options }),
        replyWithAudio: (url, options = {}) =>
          replyBuilder({ audio: { url }, mimetype: 'audio/mpeg', ...options }),
        replyWithVideo: (url, options = {}) =>
          replyBuilder({ video: { url }, ...options }),
        replyWithImage: (url, options = {}) =>
          replyBuilder({ image: { url }, ...options }),
        download: async (message) => {
          const msg = message || ctxData.msg
          const type = Object.keys(msg.message)[0]
          const stream = await downloadContentFromMessage(
            msg.message[type],
            type.replace('Message', '')
          )
          let buffer = Buffer.from([])
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
          return buffer
        },
        userData: ctxData.userData || {}
      }

      await commandData.execute(ctx)

      ctx.userData.stats = ctx.userData.stats || {}
      ctx.userData.stats.commands = (ctx.userData.stats.commands || 0) + 1
      services.dbService.markDirty()
    } catch (error) {
      try {
        await bot.ws.sendMessage(
          job.data.ctxData.chatId,
          { text: styleText(ERRORS.GENERIC_ERROR) },
          { quoted: job.data.ctxData.msg }
        )
      } catch {}
    }
  })
}
