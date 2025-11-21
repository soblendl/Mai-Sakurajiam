

import axios from 'axios';

export default {
    commands: ['ytmp3'],
    
    async execute(ctx) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply('ꕤ Proporciona un enlace de YouTube.');
            }

            const url = ctx.args[0];
            const apiUrl = `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data || !response.data.download) {
                return await ctx.reply('ꕤ No se pudo obtener el audio.');
            }

            await ctx.replyWithAudio(response.data.download, {
                fileName: `${response.data.title || 'audio'}.mp3`,
                caption: `ꕥ *YouTube MP3*\n\n✿ *Título:* ${response.data.title || 'Desconocido'}`
            });

        } catch (error) {
            console.error('Error en comando ytmp3:', error);
            await ctx.reply(
                `ꕤ Error al descargar el audio.`
            );
        }
    }
};
