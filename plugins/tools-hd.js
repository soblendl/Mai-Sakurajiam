import axios from 'axios';
import FormData from 'form-data';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Helper function to upload to Catbox
async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, 'image.jpg');

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
            ...form.getHeaders()
        }
    });

    return response.data;
}

export default {
    commands: ['hd', 'remini', 'enhance'],
    tags: ['tools'],
    help: ['hd (responde a una imagen)'],

    async execute(ctx) {
        const { msg, bot, quoted } = ctx;

        // Check if message is an image or quoted image
        const isImage = msg.message?.imageMessage;
        const isQuotedImage = quoted?.message?.imageMessage;

        if (!isImage && !isQuotedImage) {
            return await ctx.reply('ꕤ Por favor responde a una imagen o envía una imagen con el comando.');
        }

        try {
            await ctx.reply('ꕤ Procesando imagen, por favor espera...');

            // Download media
            const buffer = await downloadMediaMessage(
                quoted ? quoted : msg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: bot.sock.updateMediaMessage
                }
            );

            // Upload to Catbox to get URL
            const imageUrl = await uploadToCatbox(buffer);
            console.log('[HD] Imagen subida a:', imageUrl);

            // Call Remini API
            const apiUrl = `https://mayapi.ooguy.com/remini?apikey=may-2c29b3db&image=${encodeURIComponent(imageUrl)}`;
            const { data } = await axios.get(apiUrl);

            if (data.status && data.result) {
                await bot.sock.sendMessage(ctx.chatId, {
                    image: { url: data.result },
                    caption: 'ꕥ Imagen mejorada con éxito ✨'
                }, { quoted: msg });
            } else {
                throw new Error('API response invalid');
            }

        } catch (error) {
            console.error('[HD] Error:', error);
            await ctx.reply('ꕤ Ocurrió un error al procesar la imagen. Asegúrate de que la API esté funcionando.');
        }
    }
};
