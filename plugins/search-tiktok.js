
import axios from 'axios'
import * as baileys from '@whiskeysockets/baileys'

const tiktokSearchCommand = {
    name: 'tiktoksearch',
    aliases: ['tts', 'tiktoks'],
    category: 'search',
    description: 'Busca videos en TikTok',
    usage: '#tiktoksearch <texto>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(ctx) {
        const { chatId, args } = ctx;
        const sock = ctx.bot.sock;
        const dev = 'DeltaByte';

        if (args.length === 0) {
            return await ctx.reply(
                "《✧》 Por favor, ingrese un texto para buscar en TikTok.\n\n" +
                "Ejemplo: #tiktoksearch gatos graciosos"
            );
        }

        const text = args.join(' ');

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        try {
            let { data } = await axios.get(
                `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(text)}`
            );

            if (!data || !data.data || data.data.length === 0) {
                return await ctx.reply("《✧》 No se encontraron resultados para: " + text);
            }

            let searchResults = data.data;
            shuffleArray(searchResults);
            let topResults = searchResults.splice(0, 5); // Limit to 5 for speed

            await ctx.reply(`📱 *Resultados TikTok para:* ${text}`);

            for (let i = 0; i < topResults.length; i++) {
                const result = topResults[i];
                try {
                    await sock.sendMessage(chatId, {
                        video: { url: result.nowm },
                        caption: `📹 *Video ${i + 1}/${topResults.length}*\n\n📝 ${result.title}\n\n${dev}`
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (e) {
                    console.error(`Error enviando video ${i + 1}:`, e.message);
                }
            }
        } catch (error) {
            console.error('Error en tiktoksearch:', error);
            await ctx.reply(`《✧》 *OCURRIÓ UN ERROR:* ${error.message}`);
        }
    }
}

export default tiktokSearchCommand
