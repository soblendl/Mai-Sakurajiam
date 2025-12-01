import axios from 'axios';

const WIKI_SEARCH_API = 'https://es.wikipedia.org/w/api.php';
const WIKI_SUMMARY_API = 'https://es.wikipedia.org/api/rest_v1/page/summary';
const MAX_EXTRACT_LENGTH = 500;
const REQUEST_TIMEOUT = 15000;

export default {
    commands: ['wikipedia', 'wiki', 'wp'],
    tags: ['search'],
    help: ['wikipedia <texto a buscar>'],

    async execute(ctx) {
        const { chatId, text, prefix, command, bot, m } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return ctx.reply('❌ Error: Conexión no disponible.');
        }

        try {
            if (!text || !text.trim()) {
                return await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ ${prefix}${command} inteligencia artificial\n` +
                    `✿ ${prefix}wiki Albert Einstein\n` +
                    `✿ ${prefix}wp Colombia`
                );
            }

            const query = text.trim();

            // Buscar artículo en Wikipedia
            const searchUrl = `${WIKI_SEARCH_API}?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;

            const searchResponse = await axios.get(searchUrl, {
                timeout: REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)'
                }
            });

            const [, titles, , urls] = searchResponse.data;

            if (!titles || !Array.isArray(titles) || titles.length === 0) {
                return await ctx.reply(
                    `《✧》 No se encontraron resultados en Wikipedia para: "${query}"\n\n` +
                    `💡 *Tip:* Intenta con otros términos de búsqueda.`
                );
            }

            const title = titles[0];
            const pageUrl = urls[0];

            // Obtener resumen del artículo
            const summaryUrl = `${WIKI_SUMMARY_API}/${encodeURIComponent(title)}`;
            const summaryResponse = await axios.get(summaryUrl, {
                timeout: REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)'
                }
            });

            const pageData = summaryResponse.data;

            if (!pageData || !pageData.extract) {
                return await ctx.reply(
                    `《✧》 No se pudo obtener información para: "${query}"\n\n` +
                    `💡 *Tip:* Intenta con términos más específicos.`
                );
            }

            // Construir respuesta
            let responseText = `《✧》 *Wikipedia*\n\n`;
            responseText += `📚 *Título:* ${pageData.title || title}\n\n`;

            const extract = pageData.extract.length > MAX_EXTRACT_LENGTH
                ? pageData.extract.substring(0, MAX_EXTRACT_LENGTH) + '...'
                : pageData.extract;

            responseText += `${extract}\n\n`;
            responseText += `🔗 *Leer más:* ${pageUrl}\n`;
            responseText += `─────────────────\n`;
            responseText += `_Información de Wikipedia_`;

            // Obtener imagen si está disponible
            const imageUrl = pageData.originalimage?.source ||
                pageData.thumbnail?.source ||
                null;

            // Enviar resultado
            if (imageUrl) {
                try {
                    await conn.sendMessage(chatId, {
                        image: { url: imageUrl },
                        caption: responseText
                    }, { quoted: m });
                } catch (imgError) {
                    console.error('[Wikipedia] Error enviando imagen:', imgError.message);
                    await conn.sendMessage(chatId, {
                        text: responseText
                    }, { quoted: m });
                }
            } else {
                await conn.sendMessage(chatId, {
                    text: responseText
                }, { quoted: m });
            }

        } catch (error) {
            console.error('[Wikipedia] Error en comando:', error);

            let errorMsg = `《✧》 Error al buscar en Wikipedia.`;

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMsg += '\n\n⏱️ La solicitud tardó demasiado. Intenta de nuevo.';
            } else if (error.response) {
                if (error.response.status === 404) {
                    errorMsg += `\n\n❌ No se encontró la página para: "${text}"`;
                } else {
                    errorMsg += `\n\n❌ Error del servidor: ${error.response.status}`;
                }
            } else if (error.request) {
                errorMsg += '\n\n🌐 Sin respuesta del servidor. Verifica tu conexión.';
            } else {
                errorMsg += '\n\n💡 *Tip:* Verifica la ortografía o usa términos más específicos.';
            }

            await ctx.reply(errorMsg);
        }
    }
};