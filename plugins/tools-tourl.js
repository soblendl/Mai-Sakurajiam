import { styleText } from '../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default {
    commands: ['tourl'],

    async execute(ctx) {
        try {
            let imageMessage = null;

            // Verificar si hay una imagen citada
            if (ctx.quoted && ctx.quoted.message) {
                const quotedMsg = ctx.quoted.message;
                if (quotedMsg.imageMessage) {
                    imageMessage = quotedMsg.imageMessage;
                }
            }
            // Verificar si el mensaje actual contiene una imagen
            else if (ctx.message.imageMessage) {
                imageMessage = ctx.message.imageMessage;
            }

            if (!imageMessage) {
                return await ctx.reply(styleText(
                    'ꕤ Por favor, envía una imagen o responde a una imagen con el comando /tourl'
                ));
            }

            await ctx.reply(styleText('ꕥ Subiendo imagen a CatBox...'));

            // Descargar la imagen
            const buffer = await downloadMediaMessage(
                ctx.quoted || ctx,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: ctx.sock.updateMediaMessage
                }
            );

            // Preparar FormData para CatBox
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', buffer, {
                filename: 'image.jpg',
                contentType: 'image/jpeg'
            });

            // Subir a CatBox
            const response = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });

            const url = await response.text();

            if (url && url.startsWith('https://')) {
                await ctx.reply(styleText(
                    `ꕥ *Imagen subida exitosamente*\n\n` +
                    `> ∘ URL » *${url}*\n\n` +
                    `> _La imagen estará disponible permanentemente en CatBox._`
                ));
            } else {
                throw new Error('Respuesta inválida de CatBox');
            }

        } catch (error) {
            console.error('Error al subir imagen:', error);
            await ctx.reply(styleText(
                'ꕤ Ocurrió un error al subir la imagen a CatBox. Por favor, intenta de nuevo.'
            ));
        }
    }
};