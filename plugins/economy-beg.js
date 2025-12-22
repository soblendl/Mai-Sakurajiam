import { formatNumber, getCooldown, formatTime, getRandom, styleText } from '../lib/utils.js';
// ... (keep constants)

export default {
    commands: ['beg', 'pedir', 'mendigar', 'limosna'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }

        const COOLDOWN = 45 * 1000;
        const BASE_REWARD = Math.floor(Math.random() * 800) + 200;
        const userData = ctx.userData;

        if (!userData.economy.lastBeg) userData.economy.lastBeg = 0;

        const cooldown = getCooldown(userData.economy.lastBeg, COOLDOWN);
        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `ꕤ Ya pediste dinero hace poco.\nVuelve en: ${formatTime(cooldown)}`
            ));
        }

        ctx.dbService.updateUser(ctx.sender, { 'economy.lastBeg': Date.now() });

        const success = Math.random() > 0.25;

        if (success) {
            const result = getRandom(BEG_SUCCESS);
            const reward = Math.floor(BASE_REWARD * result.multi);

            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': userData.economy.coins + reward
            });
            await ctx.dbService.save();

            await ctx.reply(styleText(
                `${result.emoji} ${result.text} *¥${formatNumber(reward)}* coins!\n` +
                `💰 Balance: ¥${formatNumber(userData.economy.coins + reward)}`
            ));
        } else {
            const fail = getRandom(BEG_FAIL);
            await ctx.reply(styleText(`😔 ${fail}.\nNo ganaste nada esta vez.`));
        }
    }
};
