// Modül-seviyesi singleton cache — tüm client component'lar aynı promise'i paylaşır.
// /api/settings aynı sekme oturumunda yalnızca bir kez fetch edilir.

let _cache = null;
let _fetchingPromise = null;

export function getAppSettings() {
    if (_cache) return Promise.resolve(_cache);
    if (_fetchingPromise) return _fetchingPromise;
    _fetchingPromise = fetch('/api/settings')
        .then(r => r.json())
        .then(d => {
            _cache = d.settings || {};
            _fetchingPromise = null;
            return _cache;
        })
        .catch(() => {
            _fetchingPromise = null;
            return {};
        });
    return _fetchingPromise;
}

// Admin ayarları kaydettiğinde cache'i temizlemek için çağrılabilir
export function invalidateAppSettingsCache() {
    _cache = null;
    _fetchingPromise = null;
}