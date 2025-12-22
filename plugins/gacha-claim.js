import { getCooldown, formatTime, styleText } from '../lib/utils.js';

export default {
    commands: ['claim', 'c'],

    async execute(ctx) {
        const COOLDOWN = 30 * 60 * 1000;
        const userData = ctx.userData;
        const gachaService = ctx.gachaService;
        const cooldown = getCooldown(userData.gacha.lastClaim, COOLDOWN);

        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `ꕤ Ya reclamaste un personaje recientemente.\nVuelve en: ${formatTime(cooldown)}`
            ));
        }

        const rolledId = userData.gacha.rolled;
        if (!rolledId) {
            return await ctx.reply(styleText('ꕤ Primero debes girar la ruleta con #rollwaifu (#rw) para obtener un personaje.'));
        }

        const character = gachaService.getById(rolledId);
        if (!character) {
            delete userData.gacha.rolled;
            return await ctx.reply(styleText('ꕤ El personaje que giraste ya no está disponible.'));
        }

        delete userData.gacha.rolled;
        userData.gacha.lastClaim = Date.now();
        if (!userData.gacha.characters) {
            userData.gacha.characters = [];
        }

        userData.gacha.characters.push({
            id: character.id,
            name: character.name,
            source: character.source,
            value: character.value,
            img: character.img,
            claimedAt: Date.now()
        });

        try {
            gachaService.claim(ctx.sender, character.id);
        } catch (error) {
            console.error('Error reclamando personaje en GachaService:', error.message);
        }

        ctx.dbService.markDirty();
        await ctx.dbService.save();

        // Save gacha state explicitly
        await gachaService.save();

        const senderNumber = ctx.sender.split('@')[0];

        await ctx.reply(
            styleText(`ꕥ *@${senderNumber}* ha reclamado a *${character.name}* de *${character.source || 'Desconocido'}*`),
            { mentions: [ctx.sender] }
        );
    }
};
