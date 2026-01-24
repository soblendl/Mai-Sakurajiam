import { extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['kiss', 'skiss', 'kis', 'besos', 'beso', 'besar', 'besando'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;

        let who;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        } else {
            who = sender;
        }

        const senderName = from.name || sender.split('@')[0];

        let targetName;
        if (who === sender) {
            targetName = 'alguien';
        } else {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await ctx.bot.groupMetadata(chatId);
                    const whoId = who.split('@')[0].split(':')[0];

                    const participant = groupMetadata.participants.find(p => {
                        const pId = p.id.split('@')[0].split(':')[0];
                        const pLid = p.lid ? p.lid.split('@')[0].split(':')[0] : '';
                        return pId === whoId || pLid === whoId;
                    });

                    if (participant) {
                        targetName = participant.notify || participant.name || participant.id.split('@')[0].split(':')[0];
                    } else {
                        targetName = whoId;
                    }
                } else {
                    targetName = who.split('@')[0].split(':')[0];
                }
            } catch (e) {
                targetName = who.split('@')[0].split(':')[0];
            }
        }

        try {
            const res = await fetch('https://nekos.life/api/kiss');
            const json = await res.json();
            const { url } = json;

            const str = styleText(`\`${senderName}\` está besando a \`${targetName}\``);

            await ctx.bot.sendMessage(chatId, {
                image: { url: url },
                caption: str,
                mentions: [who]
            }, { quoted: msg });

        } catch (e) {
            console.error('[Kiss] Error:', e);
            await ctx.reply(styleText('ꕤ Error al obtener el beso.'));
        }
    }
};
