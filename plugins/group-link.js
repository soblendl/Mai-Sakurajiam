import { isBotAdmin } from '../lib/utils.js';

export default {
    commands: ['link', 'enlace'],
    tags: ['group'],
    help: ['link'],

    async execute(ctx) {
        const { bot, chatId, isGroup, reply } = ctx;
        const conn = bot?.sock;

        if (!isGroup) {
            return await reply('ꕤ Este comando solo funciona en grupos.');
        }

        if (!conn) {
            return await reply('❌ Error: Conexión no disponible.');
        }

        try {
            const botIsAdmin = await isBotAdmin(conn, chatId);
            if (!botIsAdmin) {
                return await reply('ꕤ Necesito ser administrador para obtener el enlace del grupo.');
            }

            const code = await conn.groupInviteCode(chatId);
            const link = `https://chat.whatsapp.com/${code}`;
            await reply(`ꕥ *Enlace del Grupo* \n\n${link}`);
        } catch (error) {
            console.error('[Link] Error:', error);
            await reply('ꕤ Ocurrió un error al obtener el enlace.');
        }
    }
};
