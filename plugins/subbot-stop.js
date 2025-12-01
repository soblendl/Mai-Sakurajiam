import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['stopjadibot', 'stopbot'],

    async execute(ctx) {
        // Ensure sender has proper WhatsApp format
        const userId = ctx.sender.includes('@') ? ctx.sender : `${ctx.sender}@s.whatsapp.net`;
        const result = jadibotManager.stopSubbot(userId);
        await ctx.reply(result.message);
    }
};
