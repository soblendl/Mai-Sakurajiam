import axios from 'axios';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['xnxx', 'xnxxdl'],
    tags: ['nsfw', 'download'],
    help: ['xnxx <url>'],

    async execute(ctx) {
        const { chatId, args, prefix, command, isGroup, dbService, reply, replyWithVideo } = ctx;

        // Verificar si es grupo y si NSFW está activo
        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData.settings?.nsfw) {
                return await reply(styleText('ꕤ Los comandos NSFW están desactivados en este grupo.\n> Un admin debe activarlos con */nsfw on*'));
            }
        }

        if (!args[0]) {
            return await reply(styleText(
                `ꕤ *Uso incorrecto del comando*\\n\\n` +
                `Ejemplo:\\n` +
                `> ${prefix}${command} https://www.xnxx.com/video-example`
            ));
        }

        const url = args[0];
        if (!url.match(/xnxx/i)) {
            return await reply(styleText('ꕤ Por favor ingresa un enlace válido de XNXX.'));
        }

        try {
            await reply(styleText('ꕥ Procesando video... 🥵'));

            const response = await axios.post("http://api-sky.ultraplus.click/xnxx",
                { url: url },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": "sk_d5a5dec0-ae72-4c87-901c-cccce885f6e6"
                    }
                }
            );

            const result = response.data?.result;

            if (!response.data?.status || !result || !result.media?.video) {
                return await reply(styleText('ꕤ No se pudo descargar el video. Verifica el enlace o intenta de nuevo más tarde.'));
            }

            const { title, duration, media } = result;
            const videoUrl = media.video;

            const caption = `ꕥ *XNXX Downloader*\\n\\n` +
                `> *Título* » ${title}\\n` +
                `> *Duración* » ${duration || 'N/A'}\\n` +
                `> *Link* » ${url}`;

            await replyWithVideo(videoUrl, {
                caption: styleText(caption),
                fileName: `xnxx_${Date.now()}.mp4`
            });

        } catch (error) {
            console.error('[XNXX DL] Error:', error);
            await reply(styleText('ꕤ Error al descargar el video. Inténtalo más tarde.'));
        }
    }
};