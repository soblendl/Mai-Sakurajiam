export default {
    commands: ['suggest', 'sugerencia', 'sugest'],
    tags: ['tools'],
    help: ['suggest <texto>'],

    async execute(ctx) {
        const { text, bot, sender } = ctx;
        const adminNumber = '573115434166@s.whatsapp.net';

        if (!text) {
            return await ctx.reply('ꕤ Por favor escribe tu sugerencia.\nEjemplo: #suggest Agregar más juegos');
        }

        try {
            const originalSender = ctx.msg.key.participant || sender;

            const suggestionMsg = `📝 *Nueva Sugerencia*\n\n` +
                `👤 *De:* @${originalSender.split('@')[0]}\n` +
                `📄 *Mensaje:* ${text}`;

            await bot.sock.sendMessage(adminNumber, {
                text: suggestionMsg,
                mentions: [originalSender]
            });

            await ctx.reply('ꕤ ¡Gracias! Tu sugerencia ha sido enviada al administrador.');
        } catch (error) {
            console.error('Error enviando sugerencia:', error);
            await ctx.reply('ꕤ Hubo un error al enviar la sugerencia. Intenta más tarde.');
        }
    }
};
