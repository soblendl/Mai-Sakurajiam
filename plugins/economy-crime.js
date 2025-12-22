import { formatNumber, getCooldown, formatTime, styleText } from '../lib/utils.js';

// Listas para generador de crímenes dinámicos
// Se combinan ACTION + TARGET para crear miles de variaciones
const ACTIONS = [
    { text: 'Robar', risk: 10, reward: 100 },
    { text: 'Hackear', risk: 30, reward: 500 },
    { text: 'Estafar a', risk: 20, reward: 300 },
    { text: 'Secuestrar', risk: 50, reward: 1000 },
    { text: 'Asaltar', risk: 40, reward: 600 },
    { text: 'Falsificar', risk: 35, reward: 400 },
    { text: 'Traficar con', risk: 60, reward: 1500 },
    { text: 'Vandalizar', risk: 15, reward: 150 },
    { text: 'Extorsionar a', risk: 45, reward: 700 },
    { text: 'Invadir', risk: 55, reward: 900 },
    { text: 'Saquear', risk: 25, reward: 350 },
    { text: 'Infiltrarse en', risk: 65, reward: 2000 },
    { text: 'Sabotear', risk: 40, reward: 550 },
    { text: 'Contrabandear', risk: 50, reward: 800 },
    { text: 'Plagiar', risk: 5, reward: 50 },
    { text: 'Lavar dinero de', risk: 70, reward: 2500 }
];

const TARGETS = [
    { text: 'un banco', risk: 40, reward: 5000 },
    { text: 'una tienda de dulces', risk: 5, reward: 50 },
    { text: 'la NASA', risk: 60, reward: 10000 },
    { text: 'un anciano', risk: 10, reward: 200 },
    { text: 'un servidor de Discord', risk: 20, reward: 1000 },
    { text: 'la billetera de Elon Musk', risk: 50, reward: 8000 },
    { text: 'un camión de helados', risk: 15, reward: 150 },
    { text: 'el Pentágono', risk: 70, reward: 15000 },
    { text: 'un McDonald\'s', risk: 10, reward: 100 },
    { text: 'una convención de Furros', risk: 30, reward: 500 },
    { text: 'la Deep Web', risk: 45, reward: 2000 },
    { text: 'un casino ilegal', risk: 50, reward: 4000 },
    { text: 'la fábrica de chocolate', risk: 25, reward: 800 },
    { text: 'un hospital', risk: 35, reward: 1200 },
    { text: 'una escuela primaria', risk: 5, reward: 20 },
    { text: 'la casa blanca', risk: 80, reward: 20000 },
    { text: 'un youtuber famoso', risk: 25, reward: 2000 },
    { text: 'una granja de bitcoins', risk: 40, reward: 6000 },
    { text: 'la mafia rusa', risk: 90, reward: 30000 },
    { text: 'un puesto de tacos', risk: 5, reward: 80 },
    { text: 'la cuenta de OnlyFans de tu tía', risk: 20, reward: 300 },
    { text: 'un satélite espía', risk: 65, reward: 12000 },
    { text: 'el Área 51', risk: 85, reward: 25000 },
    { text: 'un museo de arte', risk: 55, reward: 9000 },
    { text: 'un yate de lujo', risk: 45, reward: 7000 },
    { text: 'la base de datos de la policía', risk: 60, reward: 5000 }
];

const FAILURE_REASONS = [
    'Te resbalaste con una cáscara de plátano.',
    'Llegó la policía y te orinaste del miedo.',
    'Tu mamá te llamó en medio del acto.',
    'Te dio un calambre en la pierna.',
    'Se te olvidó la máscara en casa.',
    'El guardia de seguridad era tu ex.',
    'Te distrajiste viendo TikToks.',
    'Te atacó un perro callejero.',
    'Sonó la alarma de tu celular.',
    'Te quedaste dormido en la escena.',
    'Un niño te delató por un dulce.',
    'El auto de huida no arrancó.',
    'Te confundiste de dirección.',
    'Te dio un ataque de risa.',
    'Apareció Batman.',
    'Se te cayó el internet.',
    'Te hackearon a ti.',
    'Te enamoraste de la víctima.',
    'Te dio hambre y fuiste a comer.',
    'Te dio ansiedad.',
    'Te tropezaste con tu propio pie.',
    'Se te cayeron los pantalones.',
    'Te reconoció un fan.',
    'Te olvidaste qué ibas a hacer.',
    'Te atacaron abejas asesinas.'
];

const SUCCESS_MESSAGES = [
    'Te escapaste con el botín 😎',
    'Nadie sospechó nada 🥷',
    'Fue el crimen perfecto ✨',
    'Corriste como Naruto y escapaste 🏃‍♂️',
    'Sobornaste al guardia con un café ☕',
    'Hackeaste el sistema en segundos 💻',
    'Usaste bombas de humo para huir 💨',
    'Te hiciste pasar por estatua 🗿',
    'Engañaste a todos con tu carisma 😏',
    'Entraste y saliste como un fantasma 👻'
];

const COOLDOWN_TIME = 10 * 60 * 1000; // 10 minutos

export default {
    commands: ['crime', 'crimen', 'rob'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }

        const userData = ctx.userData;
        if (!userData.economy) userData.economy = {};

        // Verificar cooldown
        const lastCrime = userData.economy.lastCrime || 0;
        const cooldown = getCooldown(lastCrime, COOLDOWN_TIME);

        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `👮 ¡Alto ahí criminal! La policía te está buscando.\n` +
                `Debes esconderte por *${formatTime(cooldown)}* antes de cometer otro crimen.`
            ));
        }

        // Generar crimen aleatorio
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];

        const crimeName = `${action.text} ${target.text}`;
        const totalRisk = Math.min(95, action.risk + target.risk + Math.floor(Math.random() * 10)); // Max 95% riesgo
        const baseReward = action.reward + target.reward;

        // Variación aleatoria en la recompensa (+- 20%)
        const variation = (Math.random() * 0.4) + 0.8;
        const finalReward = Math.floor(baseReward * variation);

        const roll = Math.floor(Math.random() * 100) + 1;
        const successChance = 100 - totalRisk;

        let message = '';

        if (roll <= successChance) {
            // Éxito
            const successMsg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];

            // Actualizar usuario
            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': (userData.economy.coins || 0) + finalReward,
                'economy.lastCrime': Date.now()
            });
            await ctx.dbService.save(); // ¡Guardado inmediato!

            message = styleText(
                `🔫 *¡CRIMEN EXITOSO!*\n\n` +
                `> Actividad » ${crimeName}\n` +
                `> Riesgo » ${totalRisk}%\n` +
                `> Ganancia » +${formatNumber(finalReward)} coins\n\n` +
                `_${successMsg}_`
            );
        } else {
            // Fracaso
            const failReason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
            const fine = Math.floor(finalReward * 0.2); // Multa del 20% de lo que ibas a ganar
            const currentCoins = userData.economy.coins || 0;
            const lostAmount = Math.min(currentCoins, fine);

            // Actualizar usuario
            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': currentCoins - lostAmount,
                'economy.lastCrime': Date.now()
            });
            await ctx.dbService.save(); // ¡Guardado inmediato!

            message = styleText(
                `🚔 *¡TE ATRAPARON!*\n\n` +
                `> Actividad » ${crimeName}\n` +
                `> Causa » ${failReason}\n` +
                `> Pérdida » -${formatNumber(lostAmount)} coins\n\n` +
                `_La próxima vez ten más cuidado_`
            );
        }

        await ctx.reply(message);
    }
};
