/**
 * Manga Scraper Library — v2
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

// ── Helper: fetch with timeout & proper headers ──────────────────────────────
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

// ── Helper: fetch JSON ────────────────────────────────────────────────────────
async function fetchJson(url, extraHeaders = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                ...BROWSER_HEADERS,
                'Accept': 'application/json, text/plain, */*',
                ...extraHeaders,
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

// ── Helper: download image to disk ───────────────────────────────────────────
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
        const filePath = path.join(destDir, fileName);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        return fileName;
    } finally {
        clearTimeout(timer);
    }
}

// ── Site detection ────────────────────────────────────────────────────────────
export function detectSiteType(url) {
    const u = url.toLowerCase();
    if (u.includes('mangadex.org')) return 'mangadex';
    if (u.includes('comick.io') || u.includes('comick.fun')) return 'comick';
    if (u.includes('asurascans.com') || u.includes('asurascan.com') || u.includes('asura.gg')) return 'asurascans';
    if (u.includes('demonicscans.org')) return 'demonicscans';
    if (u.includes('comix.to')) return 'comixtо';
    if (u.includes('mangakakalot') || u.includes('manganato') || u.includes('readmanganato')) return 'manganato';
    if (u.includes('mangafire.to')) return 'mangafire';
    if (u.includes('luminousscans') || u.includes('luminousscans.com')) return 'luminousscans';
    if (u.includes('flamecomics') || u.includes('flamecomics.xyz')) return 'flamecomics';
    return 'generic';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MangaDex
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeMangaDex(seriesUrl) {
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

    const chapters = [];
    let offset = 0;
    while (true) {
        const data = await fetchJson(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100&offset=${offset}`);
        const items = data.data || [];
        for (const ch of items) {
            const ca = ch.attributes;
            const chNum = parseFloat(ca.chapter);
            if (!chNum || chNum <= 0) continue;
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
// Comick.io / Comick.fun
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
        .filter(c => c.chap && parseFloat(c.chap) > 0)
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
// AsuraScans — WordPress + madara/custom theme
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeAsuraScans(seriesUrl) {
    // Normalize URL: ensure it's a series page (ends with /manga/slug/ or /series/slug/)
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://asurascans.com/' });
    const $ = cheerio.load(html);

    // Title
    let title = $('h1.entry-title, h1.manga-title, .series-title h1, .post-title h1, h1').first().text().trim();

    // Cover
    let coverUrl = $('div.thumb img, .series-thumb img, .manga-thumb img, #manga-cover img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') || null;

    // Description
    const description = $('div.entry-content, div.manga-summary, .description, [class*="summary__content"]').first().text().trim();

    // Author / Artist
    const author = $('div.author-content, .manga-author, [class*="author"] a').first().text().trim();
    const artist = $('div.artist-content, .manga-artist, [class*="artist"] a').first().text().trim();

    // Genres
    const genres = [];
    $('div.genres-content a, .manga-genres a, [class*="genre"] a').each((_, el) => {
        const g = $(el).text().trim();
        if (g) genres.push(g);
    });

    // Status
    const statusText = $('div.summary-content:contains("Status"), [class*="status"]').text().toLowerCase();
    const status = statusText.includes('complete') ? 'completed' : statusText.includes('hiatus') ? 'hiatus' : 'ongoing';

    // Chapters — try multiple selectors used by Madara/AsuraScans themes
    const chapterMap = new Map();

    // Method 1: Madara theme chapter list
    $('li.wp-manga-chapter, .chapter-list li, ul.version-chap li').each((_, el) => {
        const a = $(el).find('a').first();
        const href = a.attr('href') || '';
        const text = a.text().trim();
        const numMatch = text.match(/(?:chapter|ch\.?)\s*([\d.]+)/i) || href.match(/chapter[-/]([\d.]+)/i);
        if (!numMatch) return;
        const num = parseFloat(numMatch[1]);
        if (!num || num <= 0) return;
        chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: text });
    });

    // Method 2: Generic anchor tags with chapter pattern
    if (chapterMap.size === 0) {
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            const numMatch = (text + ' ' + href).match(/(?:chapter|chap|ch)[^0-9]*([\d]+(?:\.\d+)?)/i);
            if (!numMatch) return;
            const num = parseFloat(numMatch[1]);
            if (!num || num <= 0 || num > 99999) return;
            if (!href.includes(new URL(seriesUrl).hostname)) return;
            chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: text || `Chapter ${num}` });
        });
    }

    const chapters = Array.from(chapterMap.entries())
        .map(([num, info]) => ({ chapter_number: num, title: info.title || `Chapter ${num}`, chapter_url: info.url, pages_source: 'html' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: { title: title || 'Unknown', description, status, author, artist, coverUrl, genres },
        chapters,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DemonicScans — PHP-based manga reader
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeDemonicScans(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://demonicscans.org/' });
    const $ = cheerio.load(html);

    const title = $('h1, .manga-title, .series-name, title').first().text().trim().split('|')[0].trim();
    const coverUrl = $('img.manga-cover, img.series-thumbnail, .thumb img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') || null;
    const description = $('.manga-summary, .description, [class*="synopsis"]').first().text().trim();
    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    const chapterMap = new Map();
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const numMatch = (text + ' ' + href).match(/(?:chapter|chap|ch|ep)[^0-9]*([\d]+(?:\.\d+)?)/i);
        if (!numMatch) return;
        const num = parseFloat(numMatch[1]);
        if (!num || num <= 0 || num > 99999) return;
        if (!href.includes(new URL(seriesUrl).hostname) && !href.startsWith('/')) return;
        if (!chapterMap.has(num)) {
            chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: text || `Chapter ${num}` });
        }
    });

    const chapters = Array.from(chapterMap.entries())
        .map(([num, info]) => ({ chapter_number: num, title: info.title, chapter_url: info.url, pages_source: 'html' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres },
        chapters,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Comix.to
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeComixTo(seriesUrl) {
    const html = await fetchHtml(seriesUrl, { 'Referer': 'https://comix.to/' });
    const $ = cheerio.load(html);

    const title = $('h1, .series-title, .manga-title, [class*="title"]').first().text().trim().split('|')[0].trim() ||
        $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'Unknown';
    const coverUrl = $('meta[property="og:image"]').attr('content') ||
        $('[class*="cover"] img, [class*="thumb"] img, .poster img').first().attr('src') || null;
    const description = $('meta[name="description"]').attr('content') ||
        $('[class*="summary"], [class*="synopsis"], [class*="description"]').first().text().trim();
    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a, [class*="tag"] a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    // Try to find chapters from Next.js __NEXT_DATA__ or similar
    let chapters = tryExtractNextData($, seriesUrl) || [];

    if (chapters.length === 0) {
        const chapterMap = new Map();
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            const numMatch = (text + ' ' + href).match(/(?:chapter|chap|ch|episode|ep)[^0-9]*([\d]+(?:\.\d+)?)/i);
            if (!numMatch) return;
            const num = parseFloat(numMatch[1]);
            if (!num || num <= 0 || num > 99999) return;
            if (!chapterMap.has(num)) {
                chapterMap.set(num, { url: makeAbsUrl(href, seriesUrl), title: text || `Chapter ${num}` });
            }
        });
        chapters = Array.from(chapterMap.entries())
            .map(([num, info]) => ({ chapter_number: num, title: info.title, chapter_url: info.url, pages_source: 'html' }))
            .sort((a, b) => a.chapter_number - b.chapter_number);
    }

    return {
        meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres },
        chapters,
    };
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
    const author = $('[class*="author"] a, span:contains("Author") + a').first().text().trim();
    const genres = [];
    $('td.table-value a[class*="a-h"]').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    const chapterMap = new Map();
    $('ul.row-content-chapter li a, .chapter-list li a, .row-content-chapter a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const numMatch = href.match(/chapter[_-]([\d]+(?:[_-][\d]+)?)/i) || text.match(/chapter\s+([\d.]+)/i);
        if (!numMatch) return;
        const numStr = numMatch[1].replace(/_/g, '.').replace(/-(\d)$/, '.$1');
        const num = parseFloat(numStr);
        if (!num || num <= 0) return;
        if (!chapterMap.has(num)) {
            chapterMap.set(num, { url: href, title: text || `Chapter ${num}` });
        }
    });

    const chapters = Array.from(chapterMap.entries())
        .map(([num, info]) => ({ chapter_number: num, title: info.title, chapter_url: info.url, pages_source: 'html' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: { title, description, status: 'ongoing', author, artist: '', coverUrl, genres },
        chapters,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generic scraper (improved)
// ═══════════════════════════════════════════════════════════════════════════════
async function scrapeGeneric(seriesUrl) {
    const origin = (() => { try { return new URL(seriesUrl).origin; } catch { return ''; } })();
    const html = await fetchHtml(seriesUrl, { 'Referer': origin + '/' });
    const $ = cheerio.load(html);

    // Try Next.js / Nuxt embedded JSON first
    const nextDataChapters = tryExtractNextData($, seriesUrl);

    // Title
    let title = $('h1.entry-title, h1.manga-title, .series-title, [class*="series-name"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content')?.split(/[|\-–—]/)[0].trim() ||
        $('title').text().split(/[|\-–—]/)[0].trim() || 'Unknown';
    title = title.replace(/\s*manga\s*$/i, '').trim();

    const coverUrl = $('meta[property="og:image"]').attr('content') ||
        $('[class*="cover"] img, [class*="poster"] img, [class*="thumb"] img, div.thumb img').first().attr('src') || null;

    const description = $('meta[property="og:description"]').attr('content') ||
        $('[class*="description"], [class*="synopsis"], [class*="summary"]').first().text().trim() || '';

    const author = $('[class*="author"] a, .author').first().text().trim();
    const genres = [];
    $('[class*="genre"] a, .genres a').each((_, el) => { const g = $(el).text().trim(); if (g) genres.push(g); });

    // Status
    const pageText = $('body').text().toLowerCase();
    const status = pageText.includes('completed') || pageText.includes('finished') ? 'completed' :
        pageText.includes('hiatus') || pageText.includes('on hold') ? 'hiatus' : 'ongoing';

    if (nextDataChapters && nextDataChapters.length > 0) {
        return { meta: { title, description, status, author, artist: '', coverUrl, genres }, chapters: nextDataChapters };
    }

    // Build chapter list from links
    const chapterMap = new Map();
    const chapterRegex = /(?:chapter|chap|ch|ep(?:isode)?)[^0-9]*([\d]+(?:[\._][\d]+)?)/i;

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const combined = text + ' ' + href;
        const numMatch = combined.match(chapterRegex);
        if (!numMatch) return;
        const numStr = numMatch[1].replace(/_/g, '.');
        const num = parseFloat(numStr);
        if (!num || num <= 0 || num > 99999) return;

        let absUrl;
        try { absUrl = new URL(href, seriesUrl).toString(); } catch { return; }
        // Skip if it links to a completely different domain (social media, etc)
        try {
            const linkHost = new URL(absUrl).hostname;
            const baseHost = new URL(seriesUrl).hostname;
            if (linkHost !== baseHost) return;
        } catch { return; }

        if (!chapterMap.has(num)) {
            chapterMap.set(num, { url: absUrl, title: text || `Chapter ${num}` });
        }
    });

    const chapters = Array.from(chapterMap.entries())
        .map(([num, info]) => ({ chapter_number: num, title: info.title, chapter_url: info.url, pages_source: 'html' }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return { meta: { title, description, status, author, artist: '', coverUrl, genres }, chapters };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fetch chapter pages — HTML sites
// ═══════════════════════════════════════════════════════════════════════════════
export async function fetchHtmlChapterPages(chapterUrl, siteType = 'generic') {
    const origin = (() => { try { return new URL(chapterUrl).origin; } catch { return ''; } })();
    const html = await fetchHtml(chapterUrl, { 'Referer': origin + '/' });
    const $ = cheerio.load(html);

    // 1. Look for Next.js/React embedded image arrays in JSON
    const jsonImages = extractImagesFromScripts($, chapterUrl);
    if (jsonImages.length > 3) return jsonImages;

    // 2. Site-specific selectors
    const SELECTORS = [
        // AsuraScans / Madara themes
        '#readerarea img[src], #readerarea img[data-src]',
        '.reading-content img[src], .reading-content img[data-src]',
        '.read-img img, .read-content img',
        // General manga readers
        'div.page-break img, div.wp-manga-chapter-img img',
        '.chapter-content img, .chapter-images img, .chapter img',
        '#pages img, .pages img, .page img',
        '[class*="reader"] img[src*="cdn"], [class*="reader"] img[src*="image"]',
        '[class*="chapter"] img[src*="cdn"], [class*="chapter"] img[src*="image"]',
        // DemonicScans
        '#arraydata',
        '.container img[src*="/manga/"], .container img[src*="/chapter/"]',
        // Comix.to
        '[class*="viewer"] img, [class*="page-wrap"] img',
    ];

    let images = [];
    for (const sel of SELECTORS) {
        const found = [];
        $(sel).each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || '';
            if (isValidImageUrl(src)) found.push(src.trim());
        });
        if (found.length > 2) { images = dedupeUrls(found); break; }
    }

    // 3. Scan all img tags
    if (images.length === 0) {
        $('img').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
            if (isValidImageUrl(src) && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('banner')) {
                images.push(src.trim());
            }
        });
        images = dedupeUrls(images).filter(u => !u.includes('favicon'));
    }

    // Make all URLs absolute
    images = images.map(u => {
        try { return new URL(u, chapterUrl).toString(); } catch { return u; }
    }).filter(Boolean);

    return images;
}

// ── Extract images from inline JS / JSON ──────────────────────────────────────
function extractImagesFromScripts($, baseUrl) {
    const images = [];
    $('script').each((_, el) => {
        const src = $(el).html() || '';

        // Pattern: JSON arrays like ["https://...jpg", "https://...jpg"]
        const arrMatch = src.match(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"(?:,"https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*")+\]/);
        if (arrMatch) {
            try {
                const arr = JSON.parse(arrMatch[0]);
                if (arr.length > 2) { arr.forEach(u => { if (isValidImageUrl(u)) images.push(u); }); }
            } catch {}
        }

        // Pattern: variable with array of image strings
        const varMatches = src.matchAll(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"]+)?)"/g);
        const found = [];
        for (const m of varMatches) {
            if (!m[1].includes('logo') && !m[1].includes('icon') && !m[1].includes('banner')) {
                found.push(m[1]);
            }
        }
        // Only use if we found a meaningful cluster (5+ images from same domain)
        if (found.length >= 5) {
            const domains = {};
            found.forEach(u => {
                try { const h = new URL(u).hostname; domains[h] = (domains[h] || 0) + 1; } catch {}
            });
            const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
            if (topDomain && topDomain[1] >= 5) {
                found.filter(u => { try { return new URL(u).hostname === topDomain[0]; } catch { return false; } })
                    .forEach(u => images.push(u));
            }
        }

        // Next.js __NEXT_DATA__
        if (src.includes('__NEXT_DATA__') || el.attribs?.id === '__NEXT_DATA__') {
            try {
                const data = JSON.parse(src.replace(/.*?=\s*/, '').replace(/;.*$/, ''));
                extractImagesFromObject(data, images);
            } catch {}
        }
    });

    return dedupeUrls(images);
}

function extractImagesFromObject(obj, result, depth = 0) {
    if (depth > 8 || !obj) return;
    if (typeof obj === 'string') {
        if (isValidImageUrl(obj)) result.push(obj);
        return;
    }
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

// ── Try to extract chapters from __NEXT_DATA__ ───────────────────────────────
function tryExtractNextData($, seriesUrl) {
    const scriptEl = $('script#__NEXT_DATA__');
    if (!scriptEl.length) return null;
    try {
        const data = JSON.parse(scriptEl.html() || '{}');
        const chapters = [];
        extractChaptersFromObject(data, chapters, seriesUrl);
        if (chapters.length > 0) return chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    } catch {}
    return null;
}

function extractChaptersFromObject(obj, result, baseUrl, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
        obj.forEach(v => extractChaptersFromObject(v, result, baseUrl, depth + 1));
        return;
    }
    // Look for objects that look like chapters
    const keys = Object.keys(obj);
    if ((keys.includes('chapter_number') || keys.includes('chapterNumber') || keys.includes('number')) &&
        (keys.includes('url') || keys.includes('slug') || keys.includes('id'))) {
        const num = parseFloat(obj.chapter_number || obj.chapterNumber || obj.number);
        if (num > 0) {
            let url = obj.url || obj.slug || '';
            if (url && !url.startsWith('http')) url = new URL(url, baseUrl).toString();
            result.push({ chapter_number: num, title: obj.title || obj.name || `Chapter ${num}`, chapter_url: url, pages_source: 'html' });
            return;
        }
    }
    Object.values(obj).forEach(v => extractChaptersFromObject(v, result, baseUrl, depth + 1));
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function makeAbsUrl(href, baseUrl) {
    if (!href) return '';
    try { return new URL(href, baseUrl).toString(); } catch { return href; }
}

function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('http')) return false;
    if (/\.(js|css|html|htm|php|json|xml|ico|svg)(\?|$)/i.test(url)) return false;
    if (/\.(jpg|jpeg|png|webp|gif|avif|bmp)(\?|$)/i.test(url)) return true;
    // Check if it looks like an image CDN URL without extension
    if (url.includes('/uploads/') || url.includes('/images/') || url.includes('/manga/') ||
        url.includes('/chapter/') || url.includes('cdn.') || url.includes('storage.')) return true;
    return false;
}

function dedupeUrls(arr) {
    const seen = new Set();
    return arr.filter(u => { if (seen.has(u)) return false; seen.add(u); return true; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════
export async function scrapeSeriesInfo(url) {
    const type = detectSiteType(url);
    switch (type) {
        case 'mangadex': return scrapeMangaDex(url);
        case 'comick': return scrapeComick(url);
        case 'asurascans': return scrapeAsuraScans(url);
        case 'demonicscans': return scrapeDemonicScans(url);
        case 'comixtо': return scrapeComixTo(url);
        case 'manganato': return scrapeManganato(url);
        default: return scrapeGeneric(url);
    }
}

export async function fetchChapterPages(chapter) {
    if (chapter.pages_source === 'mangadex' && chapter.mangadex_id) {
        return fetchMangaDexPages(chapter.mangadex_id);
    }
    if (chapter.pages_source === 'comick' && chapter.comick_hid) {
        return fetchComickPages(chapter.comick_hid);
    }
    const chapterUrl = chapter.chapter_url;
    if (!chapterUrl) return [];

    const siteType = detectSiteType(chapterUrl);
    return fetchHtmlChapterPages(chapterUrl, siteType);
}

// ── Download pages and save to DB ─────────────────────────────────────────────
export async function downloadAndSaveChapterPages(db, chapterId, pageUrls, referer = '') {
    const pagesDir = path.join(process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

    // Clear existing pages
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