import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['code', 'jadibot'],

    async execute(ctx) {
        const { args, sender, chatId, command } = ctx;

        // Extract phone number from sender's WhatsApp ID (format: phoneNumber@s.whatsapp.net)
        const extractPhoneNumber = (jid) => {
            if (!jid) return null;
            const phone = jid.split('@')[0];
            return phone ? phone.replace(/[^0-9]/g, '') : null;
        };

        // If user used #code command directly (no args)
        if (command === 'code' && args.length === 0) {
            const phoneNumber = extractPhoneNumber(sender);

            if (!phoneNumber || phoneNumber.length < 10) {
                return await ctx.reply('ꕤ No se pudo extraer tu número. Asegúrate de usar WhatsApp con un número válido.');
            }

            await ctx.reply('⏳ Iniciando vinculación con código de 8 dígitos...');

            try {
                const result = await jadibotManager.startSubbot(null, chatId, ctx.bot.sock, phoneNumber);
                if (!result.success) {
                    await ctx.reply(result.message || 'ꕤ Error al iniciar subbot');
                }
            } catch (error) {
                console.error('[Code] Error:', error);
                await ctx.reply('ꕤ Error al generar el código. Inténtalo de nuevo.');
            }
            return;
        }

        // If user provides a specific number (for linking a different account)
        if (args.length > 0) {
            const phoneNumber = args[0].replace(/[^0-9]/g, '');
            if (phoneNumber.length < 10) {
                return await ctx.reply('ꕤ Por favor ingresa un número válido (ej: 521234567890).');
            }

            await ctx.reply('⏳ Iniciando vinculación con código para el número especificado...');

            try {
                const result = await jadibotManager.startSubbot(null, chatId, ctx.bot.sock, phoneNumber);
                if (!result.success) {
                    await ctx.reply(result.message || 'ꕤ Error al iniciar subbot');
                }
            } catch (error) {
                console.error('[Code] Error:', error);
                await ctx.reply('ꕤ Error al generar el código. Inténtalo de nuevo.');
            }
            return;
        }

        // Default: show options
        const userPhone = extractPhoneNumber(sender);
        // Ensure sender has proper WhatsApp format
        const userId = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;
        const code = jadibotManager.createCode(userId);

        await ctx.reply(
            `ꕤ *Jadibot (Sub-Bot)*\n\n` +
            `Opción 1: *Código QR*\n` +
            `Usa *#qr ${code}* para obtener el QR.\n\n` +
            `Opción 2: *Código de 8 Dígitos*\n` +
            `Usa *#code* para recibir el código de vinculación en tu número (${userPhone}).\n\n` +
            `Opción 3: *Otro Número*\n` +
            `Usa *#jadibot <numero>* para vincular otro número.\n` +
            `Ejemplo: #jadibot 521234567890`
        );
    }
};
