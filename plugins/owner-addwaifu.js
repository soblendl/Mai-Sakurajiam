import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UploadService } from '../lib/UploadService.js';
import { downloadMediaMessage } from 'baileys';
import { styleText, isOwner, getBuffer } from '../lib/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    commands: [], // No explicit commands, works via detection
    tags: ['owner'],
    help: ['addwaifu'],

    // Hook para interceptar mensajes
    before: async (ctx) => {
        const text = ctx.body || '';
        
        // Verificar si es owner
        if (!isOwner(ctx.sender)) return false;

        // Regex para detectar el formato sin prefijo
        // ❀ Nombre » (nombre)
        // ⚥ Genero » (genero)
        // ✰ Valor » (valor)
        // ♡ Estado » (estado)
        // ❖ Fuente » (fuente)
        const regex = /❀ Nombre »\s*(.+)\s*[\n\r]+⚥ Genero »\s*(.+)\s*[\n\r]+✰ Valor »\s*(.+)\s*[\n\r]+♡ Estado »\s*(.+)\s*[\n\r]+❖ Fuente »\s*(.+)/i;

        const match = text.match(regex);
        if (!match) return false;

        // Extraer datos
        const name = match[1].trim();
        const gender = match[2].trim();
        const value = parseInt(match[3].trim().replace(/\D/g, '')) || 0;
        const status = match[4].trim();
        const source = match[5].trim();

        // ===== VALIDAR SI EL NOMBRE YA EXISTE =====
        const dbDir = path.join(__dirname, '..', 'database');
        const charactersPath = path.join(dbDir, 'characters.json');
        const newCharactersPath = path.join(dbDir, 'new_characters.json');

        // Función auxiliar para normalizar nombres (ignora mayúsculas/minúsculas y espacios extra)
        const normalizeName = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizedInputName = normalizeName(name);

        // Revisar characters.json
        if (fs.existsSync(charactersPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
                if (Array.isArray(existing)) {
                    const duplicate = existing.find(c => normalizeName(c.name) === normalizedInputName);
                    if (duplicate) {
                        await ctx.reply(styleText(
                            `⚠️ *Personaje Duplicado*\n\n` +
                            `El personaje "${name}" ya existe en la base de datos.\n` +
                            `ID existente: ${duplicate.id}\n\n` +
                            `> No se agregó el personaje.`
                        ));
                        return true;
                    }
                }
            } catch (e) {
                console.error('Error leyendo characters.json:', e);
            }
        }

        // Revisar new_characters.json
        if (fs.existsSync(newCharactersPath)) {
            try {
                const existingNew = JSON.parse(fs.readFileSync(newCharactersPath, 'utf8'));
                if (Array.isArray(existingNew)) {
                    const duplicate = existingNew.find(c => normalizeName(c.name) === normalizedInputName);
                    if (duplicate) {
                        await ctx.reply(styleText(
                            `⚠️ *Personaje Duplicado*\n\n` +
                            `El personaje "${name}" ya existe en nuevos personajes.\n` +
                            `ID existente: ${duplicate.id}\n\n` +
                            `> No se agregó el personaje.`
                        ));
                        return true;
                    }
                }
            } catch (e) {
                console.error('Error leyendo new_characters.json:', e);
            }
        }

        // ===== FIN DE VALIDACIÓN =====

        // Verificar imagen adjunta o citada
        let imageBuffer = null;
        let msg = ctx.msg;

        try {
            const message = msg.message;

            // 1. Direct Image (imageMessage)
            if (message.imageMessage) {
                imageBuffer = await downloadMediaMessage(msg, 'buffer');
            } 
            // 2. Quoted Image
            else if (message.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = message.extendedTextMessage.contextInfo.quotedMessage;
                // Construct minimal message object for baileys downloader
                const fakeMsg = {
                    key: {
                        remoteJid: ctx.chatId,
                        id: message.extendedTextMessage.contextInfo.stanzaId,
                        participant: message.extendedTextMessage.contextInfo.participant
                    },
                    message: quoted
                };
                
                if (quoted.imageMessage || quoted.viewOnceMessageV2?.message?.imageMessage) {
                    imageBuffer = await downloadMediaMessage(fakeMsg, 'buffer');
                }
            }
            // 3. ViewOnce Direct
            else if (message.viewOnceMessageV2?.message?.imageMessage) {
                imageBuffer = await downloadMediaMessage(msg, 'buffer');
            }
        } catch (e) {
            console.error('Error downloading image for addwaifu:', e);
            await ctx.reply(styleText(`❌ Error interno descargando imagen: ${e.message}`));
        }

        if (!imageBuffer) {
            await ctx.reply(styleText('ꕤ Falta la imagen. Por favor adjunta una imagen o responde a una imagen con el formulario.'));
            return true; 
        }

        try {
            await ctx.reply(styleText('⏳ Subiendo imagen y guardando personaje...'));

            // Subir imagen a Catbox
            const imageUrl = await UploadService.uploadToCatbox(imageBuffer);

            // Determinar nuevo ID
            let lastId = 0;
            
            // Chequear new_characters.json para IDs
            if (fs.existsSync(newCharactersPath)) {
                try {
                    const existingNew = JSON.parse(fs.readFileSync(newCharactersPath, 'utf8'));
                    if (Array.isArray(existingNew) && existingNew.length > 0) {
                        const ids = existingNew.map(c => parseInt(c.id)).filter(n => !isNaN(n));
                        if (ids.length > 0) lastId = Math.max(lastId, ...ids);
                    }
                } catch (e) {}
            }

            const newId = (lastId + 1).toString();

            const newCharacter = {
                id: newId,
                name: name,
                gender: gender,
                value: value.toString(),
                source: source,
                img: [imageUrl],
                vid: [],
                user: null,
                status: status,
                votes: 0
            };

            // Guardar en new_characters.json
            let newCharsList = [];
            if (fs.existsSync(newCharactersPath)) {
                try {
                    newCharsList = JSON.parse(fs.readFileSync(newCharactersPath, 'utf8'));
                } catch(e) {}
            }
            if (!Array.isArray(newCharsList)) newCharsList = [];
            
            newCharsList.push(newCharacter);
            fs.writeFileSync(newCharactersPath, JSON.stringify(newCharsList, null, 3));

            await ctx.reply(styleText(
                `✅ *Personaje Agregado*\n\n` +
                `✿ ID: ${newId}\n` +
                `✿ Nombre: ${name}\n` +
                `✿ Imagen: ${imageUrl}\n\n` +
                `> Guardado en database/new_characters.json`
            ));

        } catch (error) {
            console.error('AddWaifu Error:', error);
            await ctx.reply(styleText(`❌ Error: ${error.message}`));
        }

        return true; // Stop further processing since we handled it
    },

    async execute(ctx) {
        // No execute logic needed, handled by 'before'
    }
};