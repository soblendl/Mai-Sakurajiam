import { fileURLToPath } from 'url';
import path from 'path';
import { PREFIXES, RATE_LIMIT, ERRORS } from './constants.js';
import { styleText } from './utils.js';

// Pre-cache WAPI import at module level (avoids dynamic import on each call)
let wapiModule = null;
const getWapi = async () => {
    if (!wapiModule) {
        wapiModule = await import('@imjxsx/wapi');
    }
    return wapiModule;
};

export class MessageHandler {
    constructor(dbService, gachaService, streamManager, queueManager, cacheManager) {
        this.dbService = dbService;
        this.gachaService = gachaService;
        this.streamManager = streamManager;
        this.queueManager = queueManager;
        this.cacheManager = cacheManager;
        this.PREFIX = '#';

        // Rate limiting maps
        this.rateLimitMap = new Map(); // user -> { lastCommand, count, timeout }
        this.processedMessages = new Map(); // messageId -> timestamp (deduplication)

        // Cleanup old entries every 30 seconds
        setInterval(() => this.cleanup(), 30000);
    }

    /**
     * Cleanup old rate limit and deduplication entries
     */
    cleanup() {
        const now = Date.now();

        // Clean rate limit entries older than spam window
        for (const [userId, data] of this.rateLimitMap) {
            if (now - data.lastCommand > RATE_LIMIT.SPAM_WINDOW) {
                this.rateLimitMap.delete(userId);
            }
        }

        // Clean processed messages older than 5 seconds
        for (const [msgId, timestamp] of this.processedMessages) {
            if (now - timestamp > 5000) {
                this.processedMessages.delete(msgId);
            }
        }
    }

    /**
     * Check if user is rate limited
     * @param {string} userId 
     * @returns {object} { limited: boolean, message?: string }
     */
    checkRateLimit(userId) {
        const now = Date.now();
        let userData = this.rateLimitMap.get(userId);

        // First command from user
        if (!userData) {
            this.rateLimitMap.set(userId, { lastCommand: now, count: 1, timeout: null });
            return { limited: false };
        }

        // User is in timeout (spam penalty)
        if (userData.timeout && now < userData.timeout) {
            return { limited: true, message: ERRORS.SPAM_DETECTED };
        } else if (userData.timeout) {
            // Timeout expired, reset
            userData.timeout = null;
            userData.count = 0;
        }

        // Check cooldown between commands
        if (now - userData.lastCommand < RATE_LIMIT.COMMAND_COOLDOWN) {
            userData.count++;

            // Check if spamming
            if (userData.count >= RATE_LIMIT.SPAM_THRESHOLD) {
                userData.timeout = now + RATE_LIMIT.SPAM_TIMEOUT;
                return { limited: true, message: ERRORS.SPAM_DETECTED };
            }

            return { limited: true, message: ERRORS.RATE_LIMITED };
        }

        // Reset count if outside spam window
        if (now - userData.lastCommand > RATE_LIMIT.SPAM_WINDOW) {
            userData.count = 1;
        } else {
            userData.count++;
        }

        userData.lastCommand = now;
        return { limited: false };
    }

    /**
     * Check if message was already processed (deduplication)
     * @param {string} messageId 
     * @returns {boolean}
     */
    isDuplicate(messageId) {
        if (this.processedMessages.has(messageId)) {
            return true;
        }
        this.processedMessages.set(messageId, Date.now());
        return false;
    }

    async handleMessage(bot, m) {
        try {
            // Skip own messages
            if (!m.message || m.key.fromMe) {
                return;
            }

            // Message deduplication
            const messageId = m.key.id;
            if (this.isDuplicate(messageId)) {
                return;
            }

            const chatId = m.key.remoteJid;
            let sender = m.key.participant || m.key.remoteJid;

            // Guardar el sender original (LID) para verificaciones de admin en grupos
            const senderLid = sender;

            // Extract real phone number - check ALL possible sources
            let senderPhone = null;

            // Priority 1: participantAlt (for groups with @s.whatsapp.net)
            if (m.key.participantAlt?.includes('@s.whatsapp.net')) {
                senderPhone = m.key.participantAlt.split(':')[0].split('@')[0];
            }
            // Priority 2: remoteJidAlt (for private chats with @s.whatsapp.net)
            else if (m.key.remoteJidAlt?.includes('@s.whatsapp.net')) {
                senderPhone = m.key.remoteJidAlt.split(':')[0].split('@')[0];
            }
            // Priority 3: senderAlt on message object
            else if (m.senderAlt?.includes('@s.whatsapp.net')) {
                senderPhone = m.senderAlt.split(':')[0].split('@')[0];
            }
            // Priority 4: sender already has @s.whatsapp.net
            else if (sender.includes('@s.whatsapp.net')) {
                senderPhone = sender.split(':')[0].split('@')[0];
            }
            // Priority 5: For private chats, check remoteJid
            else if (!chatId.endsWith('@g.us') && chatId.includes('@s.whatsapp.net')) {
                senderPhone = chatId.split(':')[0].split('@')[0];
            }
            // Priority 6: Try to get from bot credentials if it's the bot's own message
            else if (m.key.fromMe && bot.ws?.user?.id) {
                senderPhone = bot.ws.user.id.split(':')[0].split('@')[0];
            }

            // Convert LID to normal JID for sender if we found the phone
            if (sender.includes('@lid') && senderPhone) {
                sender = `${senderPhone}@s.whatsapp.net`;
            } else if (sender.includes('@lid')) {
                // If we couldn't find the phone, still extract the number but it might be a LID
                const lidMatch = sender.match(/^(\d+)/);
                if (lidMatch) {
                    sender = `${lidMatch[1]}@s.whatsapp.net`;
                }
            }

            const isGroup = chatId.endsWith('@g.us');

            // Extract text
            const messageType = Object.keys(m.message)[0];
            let text = '';
            if (messageType === 'conversation') {
                text = m.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = m.message.extendedTextMessage?.text || '';
            } else if (messageType === 'imageMessage') {
                text = m.message.imageMessage?.caption || '';
            } else if (messageType === 'videoMessage') {
                text = m.message.videoMessage?.caption || '';
            }

            // Build context
            const ctx = {
                bot: {
                    sendMessage: async (jid, content, options) => {
                        return await bot.ws.sendMessage(jid, content, options);
                    },
                    sock: bot.ws,
                    groupMetadata: async (jid) => {
                        return await bot.ws.groupMetadata(jid);
                    },
                    groupParticipantsUpdate: async (jid, participants, action) => {
                        return await bot.ws.groupParticipantsUpdate(jid, participants, action);
                    }
                },
                msg: m,
                sender: sender,
                senderLid: senderLid,  // ID original para verificaciones de admin en grupos
                senderPhone: senderPhone,
                chatId: chatId,
                isGroup: isGroup,
                body: text,
                text: text,
                args: [],
                userData: this.dbService.getUser(sender, senderLid),
                dbService: this.dbService,
                gachaService: this.gachaService,
                streamManager: this.streamManager,
                queueManager: this.queueManager,
                cacheManager: this.cacheManager,
                tokenService: global.tokenService,
                prembotManager: global.prembotManager,
                from: {
                    id: sender,
                    jid: sender,
                    name: m.pushName || 'Usuario'
                },
                reply: async (text, options = {}) => {
                    return await bot.ws.sendMessage(chatId, { text, ...options }, { quoted: m });
                },
                replyWithAudio: async (url, options = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        audio: { url },
                        mimetype: 'audio/mpeg',
                        ...options
                    }, { quoted: m });
                },
                replyWithVideo: async (url, options = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        video: { url },
                        ...options
                    }, { quoted: m });
                },
                replyWithImage: async (url, options = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        image: { url },
                        ...options
                    }, { quoted: m });
                },
                download: async (message) => {
                    const wapi = await getWapi();
                    const { downloadContentFromMessage } = wapi;
                    const msg = message || m;
                    const type = Object.keys(msg.message)[0];
                    const stream = await downloadContentFromMessage(msg.message[type], type.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    return buffer;
                },
                prefix: this.PREFIX
            };

            // 1. Run 'before' handlers IN PARALLEL
            if (global.beforeHandlers?.length > 0) {
                const results = await Promise.allSettled(
                    global.beforeHandlers.map(({ handler, plugin }) =>
                        handler(ctx).catch(err => {
                            console.error(`Error in before handler for ${plugin}:`, err);
                            throw err;
                        })
                    )
                );
                // Log rejected handlers
                results.forEach((result, idx) => {
                    if (result.status === 'rejected') {
                        console.error(`Before handler ${global.beforeHandlers[idx].plugin} failed`);
                    }
                });
            }

            // 2. Process Commands
            const prefix = PREFIXES.find(p => text.startsWith(p));

            if (!text || !prefix) {
                return;
            }

            // Rate limiting check
            const rateCheck = this.checkRateLimit(sender);
            if (rateCheck.limited) {
                // Only send message once per timeout period
                if (rateCheck.message === ERRORS.SPAM_DETECTED) {
                    const lastWarning = this.cacheManager.get(`spam_warn_${sender}`);
                    if (!lastWarning) {
                        await ctx.reply(styleText(rateCheck.message));
                        this.cacheManager.set(`spam_warn_${sender}`, true, 30);
                    }
                }
                return;
            }

            // Parse command and args
            const args = text.slice(prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            ctx.args = args;
            ctx.command = commandName;

            if (!commandName) return;

            // Find command
            const commandData = global.commandMap.get(commandName);
            if (!commandData) {
                const fkontak = {
                    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
                    message: {
                        contactMessage: {
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${sender.split('@')[0]}:${sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                        }
                    },
                    participant: '0@s.whatsapp.net'
                };

                await bot.ws.sendMessage(chatId, {
                    text: styleText(`(ó﹏ò｡) Lo siento, el comando *${commandName}* no existe en mis comandos.`)
                }, { quoted: fkontak });

                return;
            }


            // Execute plugin
            await commandData.execute(ctx);

            // Update user command stats
            if (!ctx.userData.stats) ctx.userData.stats = {};
            ctx.userData.stats.commands = (ctx.userData.stats.commands || 0) + 1;
            this.dbService.markDirty();

        } catch (error) {
            console.error('ꕤ Error procesando mensaje:', error);

            // Only send error message if we were actually processing a command
            // Check if the message had a prefix (meaning it was intended as a command)
            const prefix = PREFIXES.find(p => text.startsWith(p));
            if (prefix && text.slice(prefix.length).trim()) {
                const chatId = m.key.remoteJid;
                try {
                    await bot.ws.sendMessage(chatId, {
                        text: styleText(ERRORS.GENERIC_ERROR)
                    }, { quoted: m });
                } catch { }
            }
        }
    }
}
