/**
 * Manga Scraper Library — v2.1
 * Supports: MangaDex API, Comick API, AsuraScans, DemonicScans, Comix.to,
 *           WordPress/WP-Manga sites, and generic HTML readers
 */

import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

// ── Browser-like headers ──────────────────────────────────────────────────────
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
};

// ── Utility: fetch HTML ───────────────────────────────────────────────────────
export async function fetchHtml(url, extraHeaders = {}, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { ...BROWSER_HEADERS, ...extraHeaders },
            redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

// ── Utility: fetch JSON ───────────────────────────────────────────────────────
async function fetchJson(url, extraHeaders = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { ...BROWSER_HEADERS, 'Accept': 'application/json, text/plain, */*', ...extraHeaders },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

// ── Utility: download image ───────────────────────────────────────────────────
export async function downloadImage(imageUrl, destDir, pageNum, referer = '') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
        const origin = (() => { try { return new URL(imageUrl).origin; } catch { return ''; } })();
        const res = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': BROWSER_HEADERS['User-Agent'],
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': referer || origin + '/',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
            },
        });
        if (!res.ok) throw new Error(`Image HTTP ${res.status} for ${imageUrl}`);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        let ext = '.jpg';
        if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('webp')) ext = '.webp';
        else if (contentType.includes('gif')) ext = '.gif';
        else {
            try {
                const urlExt = path.extname(new URL(imageUrl).pathname).toLowerCase().split('?')[0];
                if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt)) {
                    ext = urlExt === '.jpeg' ? '.jpg' : urlExt;
                }
            } catch {}
        }

        const fileName = `page_${String(pageNum).padStart(3, '0')}${ext}`;
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(path.join(destDir, fileName), buffer);
        return fileName;
    } finally {
        clearTimeout(timer);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter number helpers — the core of correct parsing
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract chapter number from a URL path segment.
 * Looks for patterns like: /chapter-56/, /chapter/56, -chapter-56, _ch56
 * Returns null if not found.
 */
function extractChapterNumFromUrl(href) {
    if (!href) return null;
    // Most common: /chapter-56/, /chapter-56.5/, chapter/56
    const patterns = [
        /\/chapter[s]?[-_\/]+([\d]+(?:[._][\d]+)?)/i,
        /[-_]ch(?:apter)?[-_]?([\d]+(?:[._][\d]+)?)/i,
        /chapter=([\d]+(?:\.[\d]+)?)/i,
        /\/ep(?:isode)?[-_\/]+([\d]+(?:[._][\d]+)?)/i,
    ];
    for (const re of patterns) {
        const m = href.match(re);
        if (m) {
            const num = parseFloat(m[1].replace(/_/g, '.'));
            if (isValidChapterNum(num)) return num;
        }
    }
    return null;
}

/**
 * Extract chapter number from visible text.
 * "Chapter 56", "Ch. 56", "56", "Episode 3" etc.
 * MUST be explicit chapter label; bare numbers alone are rejected to avoid IDs.
 */
function extractChapterNumFromText(text) {
    if (!text) return null;
    const m = text.match(/(?:chapter|chap|ch\.?|episode|ep\.?)\s*[#]?\s*([\d]+(?:[._][\d]+)?)/i);
    if (m) {
        const num = parseFloat(m[1].replace(/_/g, '.'));
        if (isValidChapterNum(num)) return num;
    }
    return null;
}

/** Chapter numbers must be between 0.1 and 9999 */
function isValidChapterNum(num) {
    return typeof num === 'number' && !isNaN(num) && num > 0 && num <= 9999;
}

/**
 * Clean a chapter title: remove trailing dates, navigation words, "Read" prefixes, etc.
 */
function cleanChapterTitle(rawText, chapterNum) {
    if (!rawText) return `Chapter ${chapterNum}`;
    let t = rawText
        .replace(/\s+/g, ' ')
        .trim()
        // Remove trailing dates like "2026-03-29", "Mar 29 2026", "29/03/2026"
        .replace(/\s*\d{4}[-/]\d{2}[-/]\d{2}\s*$/, '')
        .replace(/\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\s*$/, '')
        .replace(/\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\s*$/i, '')
        // Remove navigation prefixes like "Read", "First", "Last", "Latest" before "Chapter"
        .replace(/^(?:read\s+)?(?:first|last|latest|newest|prev(?:ious)?|next)\s+(?:chapter|chap|ch\.?)?\s*/i, '')
        .replace(/^read\s+/i, '')
        // Remove trailing "(new)" badges
        .replace(/\s*\(new\)\s*$/i, '')
        .trim();

    if (!t) return `Chapter ${chapterNum}`;

    // If the cleaned text is only navigation keywords, return plain Chapter X
    if (/^(?:first|last|latest|newest|prev(?:ious)?|next)\s*(?:chapter|chap|ch\.?)?$/i.test(t)) {
        return `Chapter ${chapterNum}`;
    }
    return t;
}

/** Make a URL absolute */
function makeAbsUrl(href, baseUrl) {
    if (!href) return '';
    try { return new URL(href, baseUrl).toString(); } catch { return href; }
}

/** Check if a URL looks like an image */
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    if (/\.(js|css|html|htm|php|json|xml|ico|svg)(\?|$)/i.test(url)) return false;
    if (/\.(jpg|jpeg|png|webp|gif|avif|bmp)(\?|$)/i.test(url)) return true;
    if (url.includes('/uploads/') || url.includes('/images/') || url.includes('/manga/') ||
        url.includes('/chapter/') || url.includes('cdn.') || url.includes('storage.')) return true;
    return false;
}

function dedupeUrls(arr) {
    const seen = new Set();
    return arr.filter(u => { if (seen.has(u)) return false; seen.add(u); return true; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Site detection
// ═══════════════════════════════════════════════════════════════════════════════
export function detectSiteType(url) {
    const u = url.toLowerCase();
    if (u.includes('mangadex.org')) return 'mangadex';
    if (u.includes('comick.io') || u.includes('comick.fun')) return 'comick';
    if (u.includes('asurascans.com') || u.includes('asurascan.com') || u.includes('asura.gg')) return 'asurascans';
    if (u.includes('demonicscans.org')) return 'demonicscans';
    if (u.includes('comix.to')) return 'comixto';
    if (u.includes('mangakakalot') || u.includes('manganato') || u.includes('readmanganato')) return 'manganato';
    if (u.includes('mangafire.to')) return 'mangafire';
    return 'generic';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MangaDex (official API — most reliable)
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeMangaDex(seriesUrl, language = 'en') {
    const match = seriesUrl.match(/mangadex\.org\/title\/([\w-]+)/);
    if (!match) throw new Error('Invalid MangaDex URL. Expected: https://mangadex.org/title/{id}/...');
    const mangaId = match[1];

    const infoData = await fetchJson(`https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`);
    const manga = infoData.data;
    const attrs = manga.attributes;

    const title = attrs.title.en || Object.values(attrs.title)[0] || 'Unknown';
    const description = attrs.description?.en || Object.values(attrs.description || {})[0] || '';
    const authorRel = manga.relationships?.find(r => r.type === 'author');
    const artistRel = manga.relationships?.find(r => r.type === 'artist');
    const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
    const author = authorRel?.attributes?.name || '';
    const artist = artistRel?.attributes?.name || '';
    const coverFile = coverRel?.attributes?.fileName;
    const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFile}` : null;
    const tags = (attrs.tags || []).map(t => t.attributes?.name?.en || '').filter(Boolean);

    const lang = language || 'en';
    const chapters = [];
    let offset = 0;
    while (true) {
        const data = await fetchJson(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=${lang}&order[chapter]=asc&limit=100&offset=${offset}`);
        const items = data.data || [];
        for (const ch of items) {
            const ca = ch.attributes;
            const chNum = parseFloat(ca.chapter);
            if (!isValidChapterNum(chNum)) continue;
            chapters.push({ chapter_number: chNum, title: ca.title || `Chapter ${chNum}`, mangadex_id: ch.id, pages_source: 'mangadex' });
        }
        if (items.length < 100) break;
        offset += 100;
    }

    return { meta: { title, description, status: attrs.status || 'ongoing', author, artist, coverUrl, genres: tags }, chapters };
}

async function fetchMangaDexPages(chapterId) {
    const data = await fetchJson(`https://api.mangadex.org/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = data;
    return chapter.data.map(f => `${baseUrl}/data/${chapter.hash}/${f}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Comick.io (official API)
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeComick(seriesUrl) {
    const match = seriesUrl.match(/comick\.(io|fun)\/comic\/([\w-]+)/);
    if (!match) throw new Error('Invalid Comick URL. Expected: https://comick.io/comic/slug');
    const slug = match[2];

    const info = await fetchJson(`https://api.comick.fun/comic/${slug}?tachiyomi=true`);
    const comic = info.comic;
    const title = comic.title || slug;
    const author = (comic.authors || []).map(a => a.name).join(', ');
    const artist = (comic.artists || []).map(a => a.name).join(', ');

    const chapData = await fetchJson(`https://api.comick.fun/comic/${slug}/chapters?lang=en&limit=9999&tachiyomi=true`);
    const chapters = (chapData.chapters || [])
        .filter(c => c.chap && isValidChapterNum(parseFloat(c.chap)))
        .map(c => ({ chapter_number: parseFloat(c.chap), title: c.title || `Chapter ${c.chap}`, comick_hid: c.hid, pages_source: 'comick' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: { title, description: comic.desc || '', status: comic.status === 1 ? 'ongoing' : 'completed', author, artist, coverUrl: comic.cover_url || null, genres: (comic.genres || []).map(g => g.name) },
        chapters,
    };
}

async function fetchComickPages(hid) {
    const data = await fetchJson(`https://api.comick.fun/chapter/${hid}/`);
    return (data.chapter?.images || []).map(img => img.url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generic HTML-based chapter list builder (shared by HTML scrapers)
// Priority: extract number from URL (reliable), then from text label
// ═══════════════════════════════════════════════════════════════════════════════
function buildChapterListFromAnchors($, seriesUrl) {
    const chapterMap = new Map();
    const baseHost = (() => { try { return new URL(seriesUrl).hostname; } catch { return ''; } })();

    // First pass: dedicated chapter-list elements (Madara / WordPress themes)
    const chapterListSelectors = [
        'li.wp-manga-chapter',
        'li.chapter-item',
        '.eph-num',
        '.chapter-list li',
        'ul.version-chap li',
        '.chapters li',
        '.chapter-list-item',
    ];
    for (const sel of chapterListSelectors) {
        $(sel).each((_, el) => {
            const a = $(el).find('a').first();
            const href = a.attr('href') || '';
            if (!href) return;

            // Number: prefer URL pattern over text (avoids "Read First Chapter" trap)
            const numFromUrl = extractChapterNumFromUrl(href);
            // Text: only the direct text of the anchor, strip nested spans (dates etc)
            const directText = a.clone().children().remove().end().text().trim();
            const fullText = a.text().replace(/\s+/g, ' ').trim();
            const numFromText = extractChapterNumFromText(directText) || extractChapterNumFromText(fullText);
            const num = numFromUrl || numFromText;

            if (!num || !isValidChapterNum(num)) return;
            if (chapterMap.has(num)) return; // keep first (newest-first lists)

            const cleanTitle = cleanChapterTitle(directText || fullText, num);
            chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: cleanTitle });
        });
        if (chapterMap.size > 0) break;
    }

    // Second pass: scan all same-domain anchors if dedicated list not found
    if (chapterMap.size === 0) {
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            if (!href) return;

            // Must stay on same domain
            try {
                const linkHost = new URL(makeAbsUrl(href, seriesUrl)).hostname;
                if (linkHost !== baseHost) return;
            } catch { return; }

            // Number MUST come from URL for this pass (avoids "Read First Chapter" IDs)
            const num = extractChapterNumFromUrl(href);
            if (!num || !isValidChapterNum(num)) return;
            if (chapterMap.has(num)) return;

            const text = $(el).text().replace(/\s+/g, ' ').trim();
            // Reject navigation links: "Read First", "Read Latest", "Last Chapter", "First Chapter" etc.
            if (/^read\s+(first|latest|last)/i.test(text)) return;
            if (/^(first|last|latest|newest|previous|next)\s*(chapter|chap|ch)?$/i.test(text)) return;

            chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: cleanChapterTitle(text, num) });
        });
    }

    return Array.from(chapterMap.entries())
        .map(([num, info]) => ({ chapter_number: num, title: info.title || `Chapter ${num}`, chapter_url: info.url, pages_source: 'html' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AsuraScans — WordPress + Madara/custom theme
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeAsuraScans(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://asurascans.com/' });
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, h1.manga-title, .series-title h1, .post-title h1, h1').first().text().trim();
    const coverUrl = $('div.thumb img, .series-thumb img, .manga-thumb img, #manga-cover img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') || null;
    const description = $('div.entry-content p, div.manga-summary, .description, [class*="summary__content"]').first().text().trim();
    const author = $('div.author-content a, .manga-author a, [class*="author"] a').first().text().trim();
    const artist = $('div.artist-content a, .manga-artist a, [class*="artist"] a').first().text().trim();
    const genres = [];
    $('div.genres-content a, .manga-genres a, [class*="genre"] a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });
    const statusText = $('div.summary-content, [class*="status"]').text().toLowerCase();
    const status = statusText.includes('complete') ? 'completed' : statusText.includes('hiatus') ? 'hiatus' : 'ongoing';

    const chapters = buildChapterListFromAnchors($, seriesUrl);

    return { meta: { title: title || 'Unknown', description, status, author, artist, coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DemonicScans
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeDemonicScans(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://demonicscans.org/' });
    const $ = cheerio.load(html);

    const title = $('h1, .manga-title, .series-name').first().text().trim().split('|')[0].trim() ||
        $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'Unknown';
    const coverUrl = $('img.manga-cover, img.series-thumbnail, .thumb img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') || null;
    const description = $('.manga-summary, .description, [class*="synopsis"]').first().text().trim();
    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    const chapters = buildChapterListFromAnchors($, seriesUrl);

    return { meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Comix.to
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeComixTo(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://comix.to/' });
    const $ = cheerio.load(html);

    const title = $('h1, .series-title, .manga-title').first().text().trim().split('|')[0].trim() ||
        $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'Unknown';
    const coverUrl = $('meta[property="og:image"]').attr('content') ||
        $('[class*="cover"] img, [class*="thumb"] img').first().attr('src') || null;
    const description = $('meta[name="description"]').attr('content') ||
        $('[class*="summary"], [class*="synopsis"]').first().text().trim();
    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    // Try Next.js data first
    const nextChapters = tryExtractNextData($, seriesUrl);
    const chapters = (nextChapters && nextChapters.length > 0)
        ? nextChapters
        : buildChapterListFromAnchors($, seriesUrl);

    return { meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Manganato / MangaKakalot
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeManganato(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://manganato.com/' });
    const $ = cheerio.load(html);

    const title = $('h1.story-info-right, h1.manga-info-text, h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content')?.trim() || 'Unknown';
    const coverUrl = $('span.info-image img, .manga-info-pic img').attr('src') ||
        $('meta[property="og:image"]').attr('content') || null;
    const description = $('#panel-story-info-description, .panel-story-info-description').text().replace(/Description\s*:/i, '').trim();
    const author = $('[class*="author"] a').first().text().trim();
    const genres = [];
    $('td.table-value a[class*="a-h"]').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    const chapters = buildChapterListFromAnchors($, seriesUrl);

    return { meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generic fallback
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeGeneric(seriesUrl) {
    const origin = (() => { try { return new URL(seriesUrl).origin; } catch { return ''; } })();
    const html = await fetchHtml(seriesUrl, { 'Referer': origin + '/' });
    const $ = cheerio.load(html);

    // Try Next.js embedded data first
    const nextChapters = tryExtractNextData($, seriesUrl);

    let title = $('h1.entry-title, h1.manga-title, .series-title, [class*="series-name"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content')?.split(/[|\-–—]/)[0].trim() || 'Unknown';
    title = title.replace(/\s*manga\s*$/i, '').trim();

    const coverUrl = $('meta[property="og:image"]').attr('content') ||
        $('[class*="cover"] img, [class*="poster"] img, [class*="thumb"] img, div.thumb img').first().attr('src') || null;

    const description = $('meta[property="og:description"]').attr('content') ||
        $('[class*="description"], [class*="synopsis"], [class*="summary"]').first().text().trim() || '';

    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    const pageText = $('body').text().toLowerCase();
    const status = pageText.includes('completed') || pageText.includes('finished') ? 'completed' :
        pageText.includes('hiatus') ? 'hiatus' : 'ongoing';

    const chapters = (nextChapters && nextChapters.length > 0)
        ? nextChapters
        : buildChapterListFromAnchors($, seriesUrl);

    return { meta: { title, description, status, author, artist: '', coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Next.js __NEXT_DATA__ extraction helpers
// ═══════════════════════════════════════════════════════════════════════════════
function tryExtractNextData($, seriesUrl) {
    const scriptEl = $('script#__NEXT_DATA__');
    if (!scriptEl.length) return null;
    try {
        const data = JSON.parse(scriptEl.html() || '{}');
        const chapters = [];
        extractChaptersFromObject(data, chapters, seriesUrl);
        if (chapters.length > 0) return chapters.filter(c => isValidChapterNum(c.chapter_number)).sort((a, b) => a.chapter_number - b.chapter_number);
    } catch {}
    return null;
}

function extractChaptersFromObject(obj, result, baseUrl, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(v => extractChaptersFromObject(v, result, baseUrl, depth + 1)); return; }
    const keys = Object.keys(obj);
    if ((keys.includes('chapter_number') || keys.includes('chapterNumber') || keys.includes('number')) &&
        (keys.includes('url') || keys.includes('slug') || keys.includes('id'))) {
        const num = parseFloat(obj.chapter_number || obj.chapterNumber || obj.number);
        if (isValidChapterNum(num)) {
            let url = obj.url || obj.slug || '';
            if (url && !url.startsWith('http')) { try { url = new URL(url, baseUrl).toString(); } catch {} }
            result.push({ chapter_number: num, title: cleanChapterTitle(obj.title || obj.name || '', num), chapter_url: url, pages_source: 'html' });
            return;
        }
    }
    Object.values(obj).forEach(v => extractChaptersFromObject(v, result, baseUrl, depth + 1));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter page image fetching (HTML readers)
// ═══════════════════════════════════════════════════════════════════════════════
export async function fetchHtmlChapterPages(chapterUrl) {
    const origin = (() => { try { return new URL(chapterUrl).origin; } catch { return ''; } })();
    const html = await fetchHtml(chapterUrl, { 'Referer': origin + '/' });
    const $ = cheerio.load(html);

    // Collect known "cover/meta" images to exclude from fallbacks
    const metaImages = new Set();
    const ogImg = $('meta[property="og:image"]').attr('content');
    if (ogImg) metaImages.add(ogImg);
    const twitterImg = $('meta[name="twitter:image"]').attr('content');
    if (twitterImg) metaImages.add(twitterImg);

    // 1. JSON/script extraction (most reliable for modern readers)
    const jsonImages = extractImagesFromScripts($, chapterUrl);
    if (jsonImages.length > 0) return jsonImages;

    // 2. CSS selector sweep
    const SELECTORS = [
        '#readerarea img[src], #readerarea img[data-src]',
        '.reading-content img, .reading-content img[data-src]',
        '.read-img img, .read-content img',
        'div.page-break img, div.wp-manga-chapter-img img',
        '.chapter-content img, .chapter-images img',
        '#pages img, .pages img',
        '[class*="reader"] img',
        '[class*="chapter"] img',
        '.container-chapter-reader img',
        '.viewer img, [class*="viewer"] img',
    ];

    let images = [];
    for (const sel of SELECTORS) {
        const found = [];
        $(sel).each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || '';
            if (isValidImageUrl(src) && !metaImages.has(src)) found.push(src.trim());
        });
        if (found.length > 0) { images = dedupeUrls(found); break; }
    }

    // 3. All img tags fallback — exclude meta images and single-image results that look like covers
    if (images.length === 0) {
        const allImgs = [];
        $('img').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
            if (isValidImageUrl(src) && !metaImages.has(src) && !/logo|icon|avatar|banner|ad[-_]|cover/i.test(src)) {
                allImgs.push(src.trim());
            }
        });
        images = dedupeUrls(allImgs);
        // If only 1 image, it's probably still a cover or placeholder — discard
        if (images.length <= 1) images = [];
    }

    // Absolutize
    return images.map(u => { try { return new URL(u, chapterUrl).toString(); } catch { return u; } }).filter(Boolean);
}

// ── Extract image URLs from inline scripts ────────────────────────────────────
function extractImagesFromScripts($, baseUrl) {
    const images = [];

    $('script').each((_, el) => {
        const src = $(el).html() || '';

        // ── Pattern 1: ts_reader.run({...}) — Madara/WP-Manga chapter reader ──
        // e.g. ts_reader.run({"sources":[{"source":"https://...","images":["page1.jpg",...]}]})
        try {
            const tsMatch = src.match(/ts_reader\.run\s*\(\s*(\{[\s\S]*?\})\s*\)/);
            if (tsMatch) {
                const tsData = JSON.parse(tsMatch[1]);
                const sources = tsData.sources || [];
                for (const s of sources) {
                    const baseImgUrl = s.source || '';
                    const imgs = s.images || [];
                    for (const img of imgs) {
                        const full = img.startsWith('http') ? img : (baseImgUrl ? baseImgUrl.replace(/\/$/, '') + '/' + img.replace(/^\//, '') : img);
                        if (isValidImageUrl(full)) images.push(full);
                    }
                }
                if (images.length > 0) return; // found — skip other patterns
            }
        } catch {}

        // ── Pattern 2: JSON array of image URLs ──────────────────────────────
        try {
            const arrMatch = src.match(/\["https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*"(?:,"https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*")+\]/);
            if (arrMatch) {
                const arr = JSON.parse(arrMatch[0]);
                if (Array.isArray(arr) && arr.length > 2) arr.forEach(u => { if (isValidImageUrl(u)) images.push(u); });
            }
        } catch {}

        // ── Pattern 3: cluster of quoted image URLs from the same CDN ────────
        const found = [];
        for (const m of src.matchAll(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"]+)?)"/g)) {
            if (!/logo|icon|banner|avatar|profile/i.test(m[1])) found.push(m[1]);
        }
        if (found.length >= 5) {
            const domains = {};
            found.forEach(u => { try { const h = new URL(u).hostname; domains[h] = (domains[h] || 0) + 1; } catch {} });
            const top = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
            if (top && top[1] >= 5) {
                found.filter(u => { try { return new URL(u).hostname === top[0]; } catch { return false; } })
                     .forEach(u => images.push(u));
            }
        }

        // ── Pattern 4: Next.js __NEXT_DATA__ ────────────────────────────────
        if (el.attribs?.id === '__NEXT_DATA__') {
            try {
                const data = JSON.parse(src);
                extractImagesFromObject(data, images);
            } catch {}
        }
    });

    return dedupeUrls(images);
}

function extractImagesFromObject(obj, result, depth = 0) {
    if (depth > 8 || !obj) return;
    if (typeof obj === 'string') { if (isValidImageUrl(obj)) result.push(obj); return; }
    if (Array.isArray(obj)) { obj.forEach(v => extractImagesFromObject(v, result, depth + 1)); return; }
    if (typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
            if (['url', 'src', 'image', 'img', 'path', 'link'].some(kw => k.toLowerCase().includes(kw))) {
                if (typeof v === 'string' && isValidImageUrl(v)) result.push(v);
            }
            extractImagesFromObject(v, result, depth + 1);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════
export async function scrapeSeriesInfo(url, options = {}) {
    const type = detectSiteType(url);
    const language = options.language || 'en';
    switch (type) {
        case 'mangadex': return scrapeMangaDex(url, language);
        case 'comick': return scrapeComick(url);
        case 'asurascans': return scrapeAsuraScans(url);
        case 'demonicscans': return scrapeDemonicScans(url);
        case 'comixto': return scrapeComixTo(url);
        case 'manganato': return scrapeManganato(url);
        default: return scrapeGeneric(url);
    }
}

export async function fetchChapterPages(chapter) {
    if (chapter.pages_source === 'mangadex' && chapter.mangadex_id) return fetchMangaDexPages(chapter.mangadex_id);
    if (chapter.pages_source === 'comick' && chapter.comick_hid) return fetchComickPages(chapter.comick_hid);
    const chapterUrl = chapter.chapter_url;
    if (!chapterUrl) return [];
    return fetchHtmlChapterPages(chapterUrl);
}

export async function downloadAndSaveChapterPages(db, chapterId, pageUrls, referer = '') {
    const pagesDir = path.join(process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

    const existingPages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chapterId);
    for (const p of existingPages) {
        try { const fp = path.join(process.cwd(), 'public', p.image_path); if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    }
    db.prepare('DELETE FROM pages WHERE chapter_id = ?').run(chapterId);

    const saved = [];
    for (let i = 0; i < pageUrls.length; i++) {
        try {
            const fileName = await downloadImage(pageUrls[i], pagesDir, i + 1, referer);
            const imagePath = `/uploads/pages/${chapterId}/${fileName}`;
            db.prepare('INSERT INTO pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)').run(chapterId, i + 1, imagePath);
            saved.push(imagePath);
        } catch (err) {
            console.error(`Page ${i + 1} download failed for chapter ${chapterId}:`, err.message);
        }
    }
    return saved;
}