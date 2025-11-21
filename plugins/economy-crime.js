import { formatNumber, getCooldown, formatTime, getRandom } from '../lib/utils.js';

const CRIMES = [
    'robaste una computadora',
    'entraste ala casa de alguien',
    'asaltaste un banco',
    'robaste criptomonedas',
    'fuiste al metro y robaste celulares',
    'fuiste a una joyeria y ',
    'robaste la mona lisa',
    'robaste un paquete de un camion de carga',
    'hackeaste una corporación',
    'robaste una caja de pastillas'
];

export default {
    commands: ['crime', 'crimen'],

    async execute(ctx) {
        const cooldownTime = 3600000; 
        const cooldownKey = `crime_${ctx.sender}`;
        const lastUsed = ctx.dbService.db.cooldowns[cooldownKey] || 0;
        const now = Date.now();

        if (now < lastUsed + cooldownTime) {
            const timeLeft = Math.round((lastUsed + cooldownTime - now) / 60000);
            return await ctx.reply(`ꕤ Debes esperar *${timeLeft}* minutos antes de cometer otro crimen.`);
        }

        const userData = ctx.dbService.getUser(ctx.sender);
        if (!userData) {
            return await ctx.reply('ꕤ No tienes una cuenta aún. Usa */daily* para crear una.');
        }

        const success = Math.random() > 0.5;

        if (success) {
            const earned = Math.floor(Math.random() * 500) + 200;
            userData.coins += earned;
            ctx.dbService.db.cooldowns[cooldownKey] = now;
            ctx.dbService.markDirty();
            await ctx.reply(`ꕥ ¡Crimen exitoso! Ganaste *${earned}* coins.`);
        } else {
            const lost = Math.floor(Math.random() * 300) + 100;
            userData.coins = Math.max(0, userData.coins - lost);
            ctx.dbService.db.cooldowns[cooldownKey] = now;
            ctx.dbService.markDirty();
            await ctx.reply(`ꕤ ¡Te atraparon! Perdiste *${lost}* coins.`);
        }
    }
};