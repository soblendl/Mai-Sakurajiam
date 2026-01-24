import { styleText } from '../lib/utils.js';

export default {
    commands: ['testbuttons', 'tb'],
    // No agregar al menú - comando de prueba

    async execute(ctx) {
        const { chatId, bot, msg } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return await ctx.reply(styleText('ꕤ Error: Conexión no disponible.'));
        }

        try {
            // Opción 1: Botones simples (más compatibles)
            const buttons = [
                {
                    buttonId: 'btn1',
                    buttonText: { displayText: '📋 Copiar Código' },
                    type: 1
                },
                {
                    buttonId: 'btn2',
                    buttonText: { displayText: '🔗 Ver Canal' },
                    type: 1
                },
                {
                    buttonId: 'btn3',
                    buttonText: { displayText: '📞 Contactar' },
                    type: 1
                }
            ];

            const buttonMessage = {
                text: styleText("ꕥ *Test de Botones Interactivos*\n\n> Estos son todos los tipos de botones disponibles."),
                footer: 'Kaoruko-Waguri Bot',
                buttons: buttons,
                headerType: 1
            };

            await conn.sendMessage(chatId, buttonMessage, { quoted: msg });

        } catch (error) {
            console.error('[TestButtons] Error:', error);

            // Si los botones fallan, enviar mensaje de texto normal
            try {
                await ctx.reply(styleText('ꕤ Botones interactivos:\n\n1. 📋 Copiar Código\n2. 🔗 Ver Canal\n3. 📞 Contactar\n\n_Los botones no están disponibles en este momento._'));
            } catch (fallbackError) {
                console.error('[TestButtons] Fallback también falló:', fallbackError);
            }
        }
    }
};