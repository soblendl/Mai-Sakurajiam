import axios from 'axios';
import { formatNumber, getCooldown, formatTime, styleText } from '../lib/utils.js';

// Image cache for faster repeat sends
const imageCache = new Map();

// Cooldown de 10 minutos (600000 ms)
const COOLDOWN_TIME = 10 * 60 * 1000;

async function fetchImageBuffer(url) {
    if (imageCache.has(url)) {
        return imageCache.get(url);
    }
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const buffer = Buffer.from(response.data);
        // Cache up to 50 images
        if (imageCache.size >= 50) {
            const firstKey = imageCache.keys().next().value;
            imageCache.delete(firstKey);
        }
        imageCache.set(url, buffer);
        return buffer;
    } catch {
        return null;
    }
}

export default {
    commands: ['rollwaifu', 'rw'],

    async execute(ctx) {
        const gachaService = ctx.gachaService;

        // Verificar cooldown
        if (!ctx.userData.gacha) ctx.userData.gacha = {};
        const lastRoll = ctx.userData.gacha.lastRoll || 0;
        const cooldown = getCooldown(lastRoll, COOLDOWN_TIME);

        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `ꕤ Debes esperar *${formatTime(cooldown)}* para volver a hacer roll.\n\n` +
                `> _*❐ Cooldown: 10 minutos*_`
            ));
        }

        const character = gachaService.getRandom();

        if (!character) {
            return await ctx.reply(styleText('ꕤ No hay personajes disponibles.'));
        }

        // Guardar el personaje rolleado y actualizar cooldown
        ctx.userData.gacha.rolled = character.id;
        ctx.userData.gacha.lastRoll = Date.now();
        ctx.dbService.markDirty();

        const rarity = Math.floor(parseInt(character.value || 0) / 400);
        const stars = '⭐'.repeat(Math.min(rarity, 5)) || '⭐';

        const rarityText = rarity >= 5 ? 'Legendario' :
            rarity >= 4 ? 'Mítico' :
                rarity >= 3 ? 'Raro' :
                    rarity >= 2 ? 'Poco Común' : 'Común';

        const sellPrice = Math.floor(character.value * 0.8);

        let message = `ꕥ Nombre » ${character.name}\n\n`;
        message += `➭ Fuente » ${character.source || 'Desconocido'}\n`;
        message += `𖧧 Rareza » ${rarityText}\n`;
        message += `苳 Valor » ${formatNumber(character.value)}\n`;
        message += `₿ Precio » ${formatNumber(sellPrice)}\n`;
        message += `♛ Dueño » ${character.owner ? '@' + character.owner.replace(/@.+/, '') : 'Nadie'}\n\n`;
        message += `> _*❐ Usa #claim para reclamar*_`;

        if (character.img && character.img.length > 0) {
            try {
                const mentions = character.owner ? [character.owner] : [];
                // Pre-fetch image as buffer for faster sending
                const imageBuffer = await fetchImageBuffer(character.img[0]);
                if (imageBuffer) {
                    await ctx.bot.sendMessage(ctx.chatId, {
                        image: imageBuffer,
                        caption: styleText(message),
                        mentions: mentions
                    });
                } else {
                    // Fallback to URL if buffer fetch failed
                    await ctx.bot.sendMessage(ctx.chatId, {
                        image: { url: character.img[0] },
                        caption: styleText(message),
                        mentions: mentions
                    });
                }
            } catch (error) {
                console.error('[DEBUG] Error sending waifu image:', error);

                // Check if it's a disk space error
                if (error.code === 'ENOSPC') {
                    return await ctx.reply(styleText(
                        `ꕤ Error temporal del servidor (sin espacio).\\n\\n` +
                        `Mostrando información sin imagen:\\n\\n${message}`
                    ), { mentions: character.owner ? [character.owner] : [] });
                }

                // For other errors, send message without image
                await ctx.reply(styleText(message), { mentions: character.owner ? [character.owner] : [] });
            }
        } else {
            await ctx.reply(styleText(message), { mentions: character.owner ? [character.owner] : [] });
        }
    }
};
