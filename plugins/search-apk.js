import axios from 'axios';

export default {
    commands: ['apk', 'modapk'],
    tags: ['search'],
    help: ['apk <nombre app>'],

    async execute(ctx) {
        const { chatId, args, bot, prefix, command, text } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return ctx.reply('❌ Error: Conexión no disponible.');
        }

        if (!text || !text.trim()) {
            return await ctx.reply(
                `《✧》 *Uso incorrecto del comando*\n\n` +
                `Ejemplo:\n` +
                `✿ ${prefix}${command} whatsapp\n` +
                `✿ ${prefix}${command} spotify`
            );
        }

        try {
            const searchQuery = text.trim();
            const apiUrl = `https://api.stellarwa.xyz/search/apk?query=${encodeURIComponent(searchQuery)}&key=stellar-20J4F8hk`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || !data.status || !data.data) {
                return await ctx.reply(
                    'ꕤ No encontré esa aplicación.\n\n' +
                    ' Intenta con otro nombre.'
                );
            }

            const appData = data.data;
            const name = appData.name || 'Desconocido';
            const pack = appData.package || 'Desconocido';
            const size = appData.size || 'Desconocido';
            const lastUpdated = appData.lastUpdated || 'Desconocido';
            const banner = appData.banner || '';
            const dlLink = appData.dl;

            if (!dlLink) {
                return await ctx.reply('ꕤ Encontré la app, pero no el link de descarga.');
            }

            const caption = `ꕥ *APK Found!*n\n` +
                `✿ *Nombre:* ${name}\n` +
                `✿ *Paquete:* ${pack}\n` +
                `✿ *Tamaño:* ${size}\n` +
                `✿ *Actualizado:* ${lastUpdated}\n\n` +
                `──────────────────\n` +
                `> _*Por favor espere, se esta enviando el archivo..."_`;

            if (banner) {
                await conn.sendMessage(chatId, {
                    image: { url: banner },
                    caption: caption
                });
            } else {
                await ctx.reply(caption);
            }

            await conn.sendMessage(chatId, {
                document: { url: dlLink },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${name}.apk`,
                caption: `ꕥ Aquí tienes tu APK! 🎁\n✿ *${name}*`
            });

        } catch (error) {
            console.error('[APK] Error:', error);
            await ctx.reply('ꕤ Ocurrió un error al buscar la aplicación. Inténtalo más tarde.');
        }
    }
};
