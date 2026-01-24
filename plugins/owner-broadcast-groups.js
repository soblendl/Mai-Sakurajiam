import { styleText, sleep } from '../lib/utils.js';
import { OWNER_JID } from '../lib/constants.js';

export default {
    commands: ['allgroups', 'broadcastgroups', 'bcgroups', 'tx'],
    
    async execute(ctx) {
        // Verificar si es owner
        const isOwner = ctx.sender === OWNER_JID || 
                        ctx.senderPhone === OWNER_JID.split('@')[0] ||
                        ctx.sender.split('@')[0] === OWNER_JID.split('@')[0];

        if (!isOwner) {
            return await ctx.reply(styleText('ꕤ Este comando es solo para el dueño del bot.'));
        }

        const message = ctx.args.join(' ');
        if (!message) {
            return await ctx.reply(styleText('ꕤ Por favor escribe el mensaje a transmitir.'));
        }

        await ctx.reply(styleText('ꕤ Iniciando transmisión a todos los grupos...'));

        // Obtener todos los grupos
        const groups = await ctx.bot.sock.groupFetchAllParticipating();
        const groupIds = Object.keys(groups);
        
        let sent = 0;
        let failed = 0;

        const broadcastMsg = `ꕥ *COMUNICADO OFICIAL* ꕥ\n\n${message}\n\n> 📢 Transmisión Global para Grupos`;

        for (const groupId of groupIds) {
            try {
                await ctx.bot.sendMessage(groupId, { text:  styleText(broadcastMsg) });
                sent++;
                // Pequeña pausa para evitar flood
                await sleep(1500); 
            } catch (error) {
                console.error(`Error enviando a ${groupId}:`, error.message);
                failed++;
            }
        }

        await ctx.reply(styleText(
            `✅ *Transmisión Finalizada*\n\n` +
            `> 📤 Enviados: ${sent}\n` +
            `> ❌ Fallidos: ${failed}\n` +
            `> 👥 Total Grupos: ${groupIds.length}`
        ));
    }
};
