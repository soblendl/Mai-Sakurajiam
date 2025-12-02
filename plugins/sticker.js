import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadMediaMessage } from 'baileys';

export default {
    commands: ['sticker', 's'],

    async execute(ctx) {
        try {
            const { msg, bot, chatId } = ctx;

            // Extract quoted message manually since ctx.quoted doesn't exist
            const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quoted = quotedContent ? { message: quotedContent } : null;

            // Check for image/video
            const isImage = msg.message?.imageMessage || quoted?.message?.imageMessage;
            const isVideo = msg.message?.videoMessage || quoted?.message?.videoMessage;

            if (!isImage && !isVideo) {
                return await ctx.reply('ꕤ Debes enviar una imagen o video, o responder a uno.');
            }

            await ctx.reply('⏳ Creando sticker...');

            // Download media using 'baileys' directly
            const messageToDownload = quoted || msg;
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: bot.sock.updateMediaMessage
                }
            );

            // Create sticker using wa-sticker-formatter
            const sticker = new Sticker(buffer, {
                pack: 'Kaoruko Bot',
                author: 'DeltaByte',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();

            await bot.sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });

        } catch (error) {
            console.error('Error creando sticker:', error);
            await ctx.reply(`ꕤ Error al crear el sticker: ${error.message}`);
        }
    }
};
