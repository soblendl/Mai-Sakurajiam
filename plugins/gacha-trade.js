const pendingTrades = new Map();
export default {
    commands: ['trade', 'intercambio', 'aceptar'],
    tags: ['gacha'],
    help: ['trade <mi_personaje> + <su_personaje> + @usuario', 'aceptar'],

    async execute(ctx) {
        const { bot, chatId, sender, args, text, mentionedJid, reply, gachaService, command } = ctx;
        if (command === 'aceptar') {
            const trade = pendingTrades.get(chatId);
            if (!trade) {
                return await reply('ꕤ No hay ningún intercambio pendiente en este chat.');
            }

            if (trade.targetUser !== sender) {
                return await reply('ꕤ Este intercambio no es para ti.');
            }

            const { initiator, targetUser, initiatorChar, targetChar } = trade;
            const char1 = gachaService.getById(initiatorChar.id);
            const char2 = gachaService.getById(targetChar.id);
            if (char1.owner !== initiator || char2.owner !== targetUser) {
                pendingTrades.delete(chatId);
                return await reply('ꕤ El intercambio falló porque uno de los personajes ya no pertenece al dueño original.');
            }

            gachaService.transfer(initiator, targetUser, char1.id);
            gachaService.transfer(targetUser, initiator, char2.id);
            pendingTrades.delete(chatId);
            return await reply(
                `ꕥ *Intercambio Exitoso* \n\n` +
                `✧ @${initiator.split('@')[0]} recibió a *${char2.name}*\n` +
                `✧ @${targetUser.split('@')[0]} recibió a *${char1.name}*`,
                { mentions: [initiator, targetUser] }
            );
        }

        if (!mentionedJid || mentionedJid.length === 0) {
            return await reply(
                `ꕤ *Uso incorrecto*\n\n` +
                `Formato: #trade <mi_personaje> <su_personaje> @usuario\n` +
                `Ejemplo: #trade Rem Emilia @usuario`
            );
        }

        const targetUser = mentionedJid[0];
        if (targetUser === sender) {
            return await reply('ꕤ No puedes intercambiar contigo mismo.');
        }

        const cleanText = text.replace(/@\d+/g, '').trim();
        const myChars = gachaService.getUserCharacters(sender);
        myChars.sort((a, b) => b.name.length - a.name.length);
        let myChar = null;
        let theirCharName = '';
        for (const char of myChars) {
            const regex = new RegExp(`^${char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+|$)`, 'i');
            if (regex.test(cleanText)) {
                myChar = char;
                theirCharName = cleanText.slice(char.name.length).trim();
                break;
            }
        }

        if (!myChar) {
            return await reply(`ꕤ No encontré ningún personaje tuyo al inicio del mensaje.\nAsegúrate de escribir el nombre tal cual lo tienes.`);
        }

        if (!theirCharName) {
            return await reply('ꕤ Debes escribir el nombre del personaje que quieres recibir después del tuyo.');
        }

        const theirChars = gachaService.getUserCharacters(targetUser);
        const theirChar = theirChars.find(c => c.name.toLowerCase() === theirCharName.toLowerCase());
        if (!theirChar) {
            return await reply(`ꕤ @${targetUser.split('@')[0]} no tiene ningún personaje llamado "${theirCharName}".`, { mentions: [targetUser] });
        }

        pendingTrades.set(chatId, {
            initiator: sender,
            targetUser: targetUser,
            initiatorChar: myChar,
            targetChar: theirChar,
            timestamp: Date.now()
        });

        setTimeout(() => {
            const currentTrade = pendingTrades.get(chatId);
            if (currentTrade && currentTrade.timestamp === pendingTrades.get(chatId).timestamp) {
                pendingTrades.delete(chatId);
            }
        }, 120000);
        await reply(
            `ꕥ *Solicitud de Intercambio* \n\n` +
            `✧ @${sender.split('@')[0]} ofrece: *${myChar.name}*\n` +
            `✧ Para: @${targetUser.split('@')[0]} por: *${theirChar.name}*\n\n` +
            `> _*Responde con *#aceptar* para confirmar el intercambio.*_`,
            { mentions: [sender, targetUser] }
        );
    }
};
