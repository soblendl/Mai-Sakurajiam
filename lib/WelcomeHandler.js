import { generateWelcomeImage } from './CanvasWelcome.js';
import { styleText } from './utils.js';

export class WelcomeHandler {
    constructor(dbService) {
        this.dbService = dbService;
    }

    async handle(bot, event) {
        // ... (rest of the code remains the same until sendWelcome/sendGoodbye methods)
        console.log('[WelcomeHandler] Received event:', JSON.stringify(event, null, 2));
        const { id, participants, action } = event;

        // Only handle add and remove
        if (action !== 'add' && action !== 'remove') {
            console.log('[WelcomeHandler] Ignoring action:', action);
            return;
        }

        try {
            const groupData = this.dbService.getGroup(id);
            console.log('[WelcomeHandler] GroupData:', groupData ? 'Found' : 'Not Found');
            console.log('[WelcomeHandler] Settings:', groupData?.settings);

            if (!groupData || !groupData.settings) {
                console.log('[WelcomeHandler] Group data or settings missing');
                return;
            }

            const metadata = await bot.groupMetadata(id);
            console.log('[WelcomeHandler] Metadata fetched for:', metadata.subject);

            for (const participant of participants) {
                // FIX: participant puede ser un objeto {id, phoneNumber, admin} o un string
                // Extraemos el JID correcto
                const userJid = this.extractJid(participant);

                if (!userJid) {
                    console.log('[WelcomeHandler] Could not extract JID from participant:', participant);
                    continue;
                }

                // Check settings BEFORE fetching PFP
                let shouldSendWelcome = false;
                let shouldSendGoodbye = false;

                if (action === 'add' && groupData.settings.welcome) {
                    shouldSendWelcome = true;
                } else if (action === 'remove' && groupData.settings.goodbye) {
                    shouldSendGoodbye = true;
                }

                if (!shouldSendWelcome && !shouldSendGoodbye) {
                    continue;
                }

                // Get PFP using the correct JID
                const ppUrl = await this.getProfilePicture(bot, userJid);

                try {
                    if (shouldSendWelcome) {
                        await this.sendWelcome(bot, id, userJid, metadata.subject, ppUrl);
                    } else if (shouldSendGoodbye) {
                        await this.sendGoodbye(bot, id, userJid, metadata.subject, ppUrl);
                    }
                } catch (e) {
                    console.error('[WelcomeHandler] Error sending message for', userJid, e);
                }
            }
        } catch (error) {
            console.error('[WelcomeHandler] Error:', error);
        }
    }

    /**
     * Extrae el JID de un participante que puede ser string u objeto
     * @param {string|object} participant 
     * @returns {string|null}
     */
    extractJid(participant) {
        // Si es string, retornarlo directamente
        if (typeof participant === 'string') {
            return participant;
        }

        // Si es objeto, preferir phoneNumber (formato @s.whatsapp.net) sobre id (formato @lid)
        if (typeof participant === 'object' && participant !== null) {
            // phoneNumber tiene el formato correcto para menciones
            if (participant.phoneNumber) {
                return participant.phoneNumber;
            }
            // Fallback a id si no hay phoneNumber
            if (participant.id) {
                return participant.id;
            }
        }

        return null;
    }

    async getProfilePicture(bot, jid) {
        console.log('[WelcomeHandler] Getting PFP for:', jid);
        const fallback = 'https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ef70b46.jpg';
        try {
            // Create a timeout promise that rejects after 5 seconds
            const timeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout getting profile picture')), 5000);
            });

            // Race between the actual call and the timeout
            const ppUrl = await Promise.race([
                bot.profilePictureUrl(jid).catch((err) => {
                    // Silently handle item-not-found (user left or doesn't have PFP)
                    if (err?.output?.payload?.statusCode === 404 || err?.data === 404) {
                        console.log('[WelcomeHandler] User has no profile picture or is unavailable, using fallback');
                        return null;
                    }
                    // Log other errors
                    console.log('[WelcomeHandler] PFP error:', err.message);
                    return null;
                }),
                timeout
            ]);

            console.log('[WelcomeHandler] PFP Result:', ppUrl ? 'URL Found' : 'No URL');
            return ppUrl || fallback;
        } catch (error) {
            // Only log non-404 errors
            if (error?.output?.payload?.statusCode !== 404 && error?.data !== 404) {
                console.log('[WelcomeHandler] Error getting PFP (using fallback):', error.message);
            }
            return fallback;
        }
    }

    async sendWelcome(bot, chatId, userJid, groupName, ppUrl) {
        const buffer = await generateWelcomeImage('welcome', userJid, ppUrl);
        const userName = userJid.split('@')[0];

        // Fkontak aesthetics
        const fkontak = {
            key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: {
                contactMessage: {
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${userName}\nitem1.TEL;waid=${userName}:${userName}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            },
            participant: '0@s.whatsapp.net'
        };

        const text = styleText(`
༘⋆✿ *Bienvenido/a* a ${groupName}!
    » @${userName}

૮ ․ ․ ྀིა Espero que la pases bien en este grupo, y no olvides leer las reglas porfis.


> 𖣂 Usa */help* para ver la lista de comandos disponibles.
`.trim());

        await bot.sendMessage(chatId, {
            image: buffer,
            caption: text,
            mentions: [userJid]
        }, { quoted: fkontak });
    }

    async sendGoodbye(bot, chatId, userJid, groupName, ppUrl) {
        const buffer = await generateWelcomeImage('goodbye', userJid, ppUrl);
        const userName = userJid.split('@')[0];

        // Fkontak aesthetics
        const fkontak = {
            key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: {
                contactMessage: {
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${userName}\nitem1.TEL;waid=${userName}:${userName}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            },
            participant: '0@s.whatsapp.net'
        };

        const text = styleText(`
༘⋆✿ *Adiós* de ${groupName}!
    » @${userName}

૮ ․ ․ ྀིა Esperamos que vuelvas pronto por aquí.


> 𖣂 Kaoruko Waguri Bot
`.trim());

        await bot.sendMessage(chatId, {
            image: buffer,
            caption: text,
            mentions: [userJid]
        }, { quoted: fkontak });
    }
}
