import NodeCache from 'node-cache';

class CacheManager {
    constructor(ttlSeconds = 60 * 5) { // Default 5 minutes TTL
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2 });
        this.stats = { hits: 0, misses: 0, sets: 0 };
    }

    /**
     * Get value from cache (with stats tracking)
     * @param {string} key 
     * @returns {any}
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return value;
    }

    /**
     * Set value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl - Optional TTL in seconds
     */
    set(key, value, ttl) {
        this.stats.sets++;
        return this.cache.set(key, value, ttl);
    }

    /**
     * Check if key exists
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Delete key
     * @param {string} key
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Get all keys in cache
     * @returns {string[]}
     */
    keys() {
        return this.cache.keys();
    }

    /**
     * Flush all cached data
     */
    flush() {
        this.cache.flushAll();
        this.stats = { hits: 0, misses: 0, sets: 0 };
    }

    /**
     * Get cache statistics
     * @returns {object}
     */
    getStats() {
        const nodeStats = this.cache.getStats();
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
            : 0;
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            keyCount: this.cache.keys().length,
            nodeCache: nodeStats
        };
    }

    /**
     * Get or set (fetch if missing)
     * @param {string} key 
     * @param {function} fetchFn 
     * @param {number} ttl 
     */
    async getOrSet(key, fetchFn, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) return cached;

        const value = await fetchFn();
        this.set(key, value, ttl);
        return value;
    }
}

export default CacheManager;
