import axios from 'axios';

export default {
    commands: ['copilot'],
    tags: ['ai'],
    help: ['copilot <texto>'],

    async execute(ctx) {
        const { bot, chatId, args, text, reply } = ctx;

        if (!text) {
            return await reply('ꕤ Por favor escribe algo para hablar con Copilot.\nEjemplo: #copilot Hola, ¿cómo estás?');
        }

        try {
            const apiUrl = `https://api.stellarwa.xyz/ai/copilot?text=${encodeURIComponent(text)}&key=stellar-20J4F8hk`;
            const response = await axios.get(apiUrl);
            const data = response.data;
            if (!data || !data.status || !data.response) {
                return await reply('ꕤ No pude obtener una respuesta de Copilot. Inténtalo más tarde.');
            }

            await reply(data.response);
        } catch (error) {
            console.error('[Copilot] Error:', error);
            await reply('ꕤ Ocurrió un error al conectar con Copilot.');
        }
    }
};
