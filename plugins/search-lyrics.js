import axios from 'axios';

export default {
    commands: ['lyrics', 'letra'],
    tags: ['search'],
    help: ['lyrics <canción>'],

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
                `✿ ${prefix}${command} takedown twice\n` +
                `✿ ${prefix}${command} despacito`
            );
        }

        try {
            const searchQuery = text.trim();
            const apiUrl = `https://api.stellarwa.xyz/tools/lyrics?query=${encodeURIComponent(searchQuery)}&key=stellar-20J4F8hk`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || !data.status || !data.data) {
                return await ctx.reply(
                    '《✧》 No encontré la letra de esa canción. 😿\n\n' +
                    '💡 *Tip:* Intenta con el nombre del artista también.'
                );
            }

            const songData = data.data;
            const title = songData.title || 'Desconocido';
            const artist = songData.artist || 'Desconocido';
            const album = songData.album?.title || 'Desconocido';
            const artwork = songData.album?.artwork || '';
            const lyrics = songData.lyrics || 'No hay letra disponible.';

            const caption = `ꕥ *Lyrics Found!*\n\n` +
                `✿ *Título:* ${title}\n` +
                `✿ *Artista:* ${artist}\n` +
                `✿ *Álbum:* ${album}\n\n` +
                `──────────────────\n\n` +
                `${lyrics}\n\n` +
                `──────────────────\n` +
                `> _*Powered By DeltaByte*_`;

            if (artwork) {
                await conn.sendMessage(chatId, {
                    image: { url: artwork },
                    caption: caption
                });
            } else {
                await ctx.reply(caption);
            }

        } catch (error) {
            console.error('[Lyrics] Error:', error);
            await ctx.reply('《✧》 Ocurrió un error al buscar la letra. Inténtalo más tarde. 😿');
        }
    }
};
