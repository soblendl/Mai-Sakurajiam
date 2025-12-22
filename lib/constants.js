/**
 * Centralized constants and configuration
 * @module constants
 */

// Command prefixes
export const PREFIXES = ['/', '!', '#'];
export const DEFAULT_PREFIX = '#';

// Owner configuration  
export const OWNER_JID = '573115434166@s.whatsapp.net';

// Cache settings (in seconds)
export const CACHE_TTL = {
    DEFAULT: 300,        // 5 minutes
    USER_DATA: 120,      // 2 minutes
    GROUP_METADATA: 600, // 10 minutes
    MEDIA: 3600          // 1 hour
};

// Rate limiting (in milliseconds)
export const RATE_LIMIT = {
    COMMAND_COOLDOWN: 1000,     // 1 second between commands
    SPAM_THRESHOLD: 5,          // Max commands in window
    SPAM_WINDOW: 10000,         // 10 second window
    SPAM_TIMEOUT: 30000         // 30 second timeout for spammers
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
    STREAM: 30000,       // 30 seconds for streams
    API_REQUEST: 15000,  // 15 seconds for API calls
    DB_SAVE: 10000       // 10 seconds for DB operations
};

// Auto-save intervals (in milliseconds)
export const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

// Stream settings
export const STREAM = {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB max
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

// Error messages
export const ERRORS = {
    COMMAND_NOT_FOUND: '❌ Comando no encontrado.',
    RATE_LIMITED: '⏰ Estás enviando comandos muy rápido. Espera un momento.',
    SPAM_DETECTED: '🚫 Has sido silenciado por spam. Espera 30 segundos.',
    GENERIC_ERROR: 'ꕤ Ocurrió un error al ejecutar el comando.',
    DB_ERROR: '❌ Error de base de datos. Inténtalo de nuevo.',
    PERMISSION_DENIED: '🔒 No tienes permiso para usar este comando.'
};

// Success messages  
export const SUCCESS = {
    COMMAND_EXECUTED: '✅ Comando ejecutado correctamente.'
};

export default {
    PREFIXES,
    DEFAULT_PREFIX,
    OWNER_JID,
    CACHE_TTL,
    RATE_LIMIT,
    TIMEOUTS,
    AUTO_SAVE_INTERVAL,
    STREAM,
    ERRORS,
    SUCCESS
};
