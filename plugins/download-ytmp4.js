import axios from 'axios';

export default {
    commands: ['ytmp4'],
    
    async execute(ctx) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply('ꕤ Proporciona un enlace de YouTube.');
            }

            const url = ctx.args[0];
            const apiUrl = `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data || !response.data.download) {
                return await ctx.reply('ꕤ No se pudo obtener el video.');
            }

            await ctx.replyWithVideo(response.data.download, {
                fileName: `${response.data.title || 'video'}.mp4`,
                caption: `ꕥ *YouTube MP4*\n\n✿ *Título:* ${response.data.title || 'Desconocido'}`
            });

        } catch (error) {
            console.error('Error en comando ytmp4:', error);
            await ctx.reply(
                `ꕤ Error al descargar el video.`
            );
        }
    }
};
