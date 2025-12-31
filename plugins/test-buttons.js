import * as wapi from '@imjxsx/wapi'

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
            await conn.sendMessage(chatId, {
                text: styleText("ꕥ *Test de Botones Interactivos*\n\n> Estos son todos los tipos de botones disponibles."),
                footer: `Kaoruko-Waguri Bot`,
                interactiveButtons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Copiar Código',
                            copy_code: 'Kaoruko-Waguri-Bot'
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🔗 Canal de WhatsApp',
                            url: 'https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p',
                            merchant_url: 'https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p'
                        })
                    },
                    {
                        name: 'cta_call',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📞 Llamar',
                            phone_number: '573115434166'
                        })
                    },
                    {
                        name: 'cta_reminder',
                        buttonParamsJson: JSON.stringify({
                            display_text: '⏰ Recordatorio'
                        })
                    },
                    {
                        name: 'address_message',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📍 Dirección'
                        })
                    },
                    {
                        name: 'send_location',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🗺️ Enviar Ubicación'
                        })
                    },
                    {
                        name: 'open_webview',
                        buttonParamsJson: JSON.stringify({
                            title: '🌐 Abrir Web',
                            link: {
                                in_app_webview: true,
                                url: 'https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p'
                            }
                        })
                    },
                    {
                        name: 'cta_cancel_reminder',
                        buttonParamsJson: JSON.stringify({
                            display_text: '❌ Cancelar Recordatorio'
                        })
                    }
                ],
            }, { quoted: msg });

        } catch (error) {
            console.error('[TestButtons] Error:', error);
            await ctx.reply(styleText('ꕤ Error al enviar los botones interactivos.'));
        }
    }
};
