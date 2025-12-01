import sharp from 'sharp';

export default {
    commands: ['toimg', 'img'],
    tags: ['tools'],
    help: ['toimg (responde a un sticker)'],

    async execute(ctx) {
        const { msg, bot, chatId } = ctx;

        // Extract quoted message
        const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quoted = quotedContent ? { message: quotedContent } : null;

        // Check if it's a sticker
        const isSticker = quoted?.message?.stickerMessage;

        if (!isSticker) {
            return await ctx.reply('ꕤ Debes responder a un sticker.');
        }

        try {
            await ctx.reply('⏳ Convirtiendo sticker a imagen...');

            // Download sticker
            const buffer = await ctx.download(quoted);

            // Convert webp to png using sharp
            const imgBuffer = await sharp(buffer)
                .toFormat('png')
                .toBuffer();

            // Send image
            await bot.sock.sendMessage(chatId, {
                image: imgBuffer,
                caption: 'ꕥ Aquí tienes tu imagen'
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en toimg:', error);
            await ctx.reply('ꕤ Error al convertir el sticker.');
        }
    }
};
