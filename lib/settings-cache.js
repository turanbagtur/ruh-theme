/**
 * Paylaşılan settings cache modülü.
 * layout.js (SSR) ve /api/admin/settings/route.js bu modülü paylaşır.
 * Ayarlar kaydedildiğinde invalidateSettingsCache() çağrılarak cache anında temizlenir.
 */

let _cache = null;
let _cacheAt = 0;
export const SETTINGS_CACHE_TTL = 60_000; // 60 saniye

export function getSettingsCache() {
    return { cache: _cache, cacheAt: _cacheAt };
}

export function setSettingsCache(data) {
    _cache = data;
    _cacheAt = Date.now();
}

export function invalidateSettingsCache() {
    _cache = null;
    _cacheAt = 0;
}