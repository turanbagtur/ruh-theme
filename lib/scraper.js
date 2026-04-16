/**
 * Manga Scraper Library
 * Supports: MangaDex API, generic HTML manga readers (via cheerio)
 */

import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ── Helper: fetch with timeout & user agent ──────────────────────────────────
export async function fetchHtml(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 20000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                ...(options.headers || {}),
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

// ── Helper: download image to disk ───────────────────────────────────────────
export async function downloadImage(imageUrl, destDir, pageNum) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': new URL(imageUrl).origin + '/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });
        if (!res.ok) throw new Error(`Image HTTP ${res.status}`);

        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        let ext = '.jpg';
        if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('webp')) ext = '.webp';
        else if (contentType.includes('gif')) ext = '.gif';
        else {
            // Try to get extension from URL
            const urlPath = new URL(imageUrl).pathname;
            const urlExt = path.extname(urlPath).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt)) ext = urlExt === '.jpeg' ? '.jpg' : urlExt;
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

// ── Detect site type from URL ─────────────────────────────────────────────────
export function detectSiteType(url) {
    const u = url.toLowerCase();
    if (u.includes('mangadex.org')) return 'mangadex';
    if (u.includes('mangakakalot') || u.includes('manganato') || u.includes('readmanganato')) return 'manganato';
    if (u.includes('mangafire.to')) return 'mangafire';
    if (u.includes('comick.io') || u.includes('comick.fun')) return 'comick';
    return 'generic';
}

// ── MangaDex Scraper ──────────────────────────────────────────────────────────
export async function scrapeMangaDex(seriesUrl) {
    // Extract manga ID from URL: https://mangadex.org/title/{uuid}/...
    const match = seriesUrl.match(/mangadex\.org\/title\/([\w-]+)/);
    if (!match) throw new Error('Invalid MangaDex URL. Expected: https://mangadex.org/title/{id}/...');
    const mangaId = match[1];

    // Fetch manga info
    const infoRes = await fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`);
    if (!infoRes.ok) throw new Error(`MangaDex API error: ${infoRes.status}`);
    const infoData = await infoRes.json();
    const manga = infoData.data;
    const attrs = manga.attributes;

    const title = attrs.title.en || Object.values(attrs.title)[0] || 'Unknown';
    const description = attrs.description?.en || Object.values(attrs.description || {})[0] || '';
    const status = attrs.status || 'ongoing';
    const authorRel = manga.relationships?.find(r => r.type === 'author');
    const artistRel = manga.relationships?.find(r => r.type === 'artist');
    const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
    const author = authorRel?.attributes?.name || '';
    const artist = artistRel?.attributes?.name || '';
    const coverFile = coverRel?.attributes?.fileName;
    const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFile}` : null;
    const tags = (attrs.tags || []).map(t => t.attributes?.name?.en || '').filter(Boolean);

    // Fetch chapter list (English only, all chapters)
    const chapters = [];
    let offset = 0;
    const limit = 100;
    while (true) {
        const chapRes = await fetch(
            `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group`
        );
        if (!chapRes.ok) break;
        const chapData = await chapRes.json();
        const items = chapData.data || [];
        for (const ch of items) {
            const ca = ch.attributes;
            const chNum = parseFloat(ca.chapter) || 0;
            if (chNum <= 0) continue;
            chapters.push({
                chapter_number: chNum,
                title: ca.title || `Chapter ${chNum}`,
                mangadex_id: ch.id,
                pages_source: 'mangadex',
            });
        }
        if (items.length < limit) break;
        offset += limit;
    }

    return {
        meta: { title, description, status, author, artist, coverUrl, genres: tags },
        chapters,
    };
}

// ── MangaDex: fetch chapter pages ─────────────────────────────────────────────
export async function fetchMangaDexPages(chapterId) {
    const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    if (!res.ok) throw new Error(`MangaDex at-home error: ${res.status}`);
    const data = await res.json();
    const baseUrl = data.baseUrl;
    const chapter = data.chapter;
    return chapter.data.map(file => `${baseUrl}/data/${chapter.hash}/${file}`);
}

// ── Comick.io Scraper ─────────────────────────────────────────────────────────
export async function scrapeComick(seriesUrl) {
    // comick uses slug: https://comick.io/comic/slug
    const match = seriesUrl.match(/comick\.(io|fun)\/comic\/([\w-]+)/);
    if (!match) throw new Error('Invalid Comick URL');
    const slug = match[2];

    const infoRes = await fetch(`https://api.comick.fun/comic/${slug}?tachiyomi=true`);
    if (!infoRes.ok) throw new Error(`Comick API error: ${infoRes.status}`);
    const info = await infoRes.json();
    const comic = info.comic;

    const title = comic.title || slug;
    const description = comic.desc || '';
    const status = comic.status === 1 ? 'ongoing' : 'completed';
    const author = (comic.authors || []).map(a => a.name).join(', ');
    const artist = (comic.artists || []).map(a => a.name).join(', ');
    const coverUrl = comic.cover_url || null;
    const genres = (comic.genres || []).map(g => g.name);

    // Fetch chapters
    const chapRes = await fetch(`https://api.comick.fun/comic/${slug}/chapters?lang=en&limit=9999&tachiyomi=true`);
    if (!chapRes.ok) throw new Error(`Comick chapters error: ${chapRes.status}`);
    const chapData = await chapRes.json();

    const chapters = (chapData.chapters || [])
        .filter(c => c.chap && parseFloat(c.chap) > 0)
        .map(c => ({
            chapter_number: parseFloat(c.chap),
            title: c.title || `Chapter ${c.chap}`,
            comick_hid: c.hid,
            pages_source: 'comick',
        }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: { title, description, status, author, artist, coverUrl, genres },
        chapters,
    };
}

// ── Comick: fetch chapter pages ───────────────────────────────────────────────
export async function fetchComickPages(hid) {
    const res = await fetch(`https://api.comick.fun/chapter/${hid}/`);
    if (!res.ok) throw new Error(`Comick chapter error: ${res.status}`);
    const data = await res.json();
    return (data.chapter?.images || []).map(img => img.url);
}

// ── Generic HTML Scraper (Manganato/MangaKakalot style) ───────────────────────
export async function scrapeGeneric(seriesUrl) {
    const html = await fetchHtml(seriesUrl);
    const $ = cheerio.load(html);

    // Try to extract basic info
    let title = $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim().split('|')[0].trim() ||
        'Unknown Series';

    const description = $('meta[property="og:description"]').attr('content') ||
        $('[class*="description"], [class*="synopsis"], [class*="summary"]').first().text().trim() ||
        '';

    const coverUrl = $('meta[property="og:image"]').attr('content') ||
        $('[class*="cover"] img, [class*="poster"] img, [class*="thumbnail"] img').first().attr('src') ||
        null;

    // Detect chapter links — look for patterns like "chapter X" in anchor texts
    const chapterMap = new Map();
    const chapterRegex = /(?:chapter|ch\.?|chap\.?)\s*([\d.]+)/i;

    $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const matchText = text.match(chapterRegex);
        const matchHref = href.match(chapterRegex);
        const numMatch = matchText || matchHref;
        if (!numMatch) return;
        const num = parseFloat(numMatch[1]);
        if (!num || num <= 0 || num > 99999) return;

        // Build absolute URL
        let absUrl = href;
        try {
            if (!href.startsWith('http')) {
                absUrl = new URL(href, seriesUrl).toString();
            }
        } catch { return; }

        if (!chapterMap.has(num) || chapterMap.get(num).text.length < text.length) {
            chapterMap.set(num, { url: absUrl, text });
        }
    });

    const chapters = Array.from(chapterMap.entries())
        .map(([num, info]) => ({
            chapter_number: num,
            title: info.text || `Chapter ${num}`,
            chapter_url: info.url,
            pages_source: 'html',
        }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

    return {
        meta: {
            title: title.replace(/\s*manga\s*/i, '').trim(),
            description,
            status: 'ongoing',
            author: '',
            artist: '',
            coverUrl,
            genres: [],
        },
        chapters,
    };
}

// ── Generic: fetch chapter page images ───────────────────────────────────────
export async function fetchGenericPages(chapterUrl) {
    const html = await fetchHtml(chapterUrl);
    const $ = cheerio.load(html);

    // Common patterns for manga reader image containers
    const imageSelectors = [
        '#readerarea img',
        '.reader-area img',
        '.chapter-content img',
        '.reading-content img',
        '[class*="reader"] img[src*="/wp-content"]',
        '[class*="reader"] img[src*="/manga"]',
        '[class*="pages"] img',
        '.page-break img',
        '#arraydata',
    ];

    let images = [];

    for (const sel of imageSelectors) {
        const found = [];
        $(sel).each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
            if (src && src.startsWith('http') && !src.includes('favicon') && !src.includes('logo')) {
                found.push(src.trim());
            }
        });
        if (found.length > 0) {
            images = found;
            break;
        }
    }

    // Fallback: look for JS array of images in script tags
    if (images.length === 0) {
        $('script').each((_, el) => {
            const src = $(el).html() || '';
            const matches = src.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/g);
            if (matches && matches.length > 3) {
                images = matches.map(m => m.slice(1, -1)).filter(u => !u.includes('favicon'));
            }
        });
    }

    return images;
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
export async function scrapeSeriesInfo(url) {
    const type = detectSiteType(url);
    if (type === 'mangadex') return scrapeMangaDex(url);
    if (type === 'comick') return scrapeComick(url);
    return scrapeGeneric(url);
}

export async function fetchChapterPages(chapter) {
    if (chapter.pages_source === 'mangadex' && chapter.mangadex_id) {
        return fetchMangaDexPages(chapter.mangadex_id);
    }
    if (chapter.pages_source === 'comick' && chapter.comick_hid) {
        return fetchComickPages(chapter.comick_hid);
    }
    if (chapter.chapter_url) {
        return fetchGenericPages(chapter.chapter_url);
    }
    return [];
}

// ── Download pages and save to DB ─────────────────────────────────────────────
export async function downloadAndSaveChapterPages(db, chapterId, pageUrls, onProgress = null) {
    const pagesDir = path.join(process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

    // Clear existing pages for this chapter
    const existingPages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chapterId);
    for (const p of existingPages) {
        try {
            const fp = path.join(process.cwd(), 'public', p.image_path);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch {}
    }
    db.prepare('DELETE FROM pages WHERE chapter_id = ?').run(chapterId);

    const saved = [];
    for (let i = 0; i < pageUrls.length; i++) {
        const pageNum = i + 1;
        try {
            const fileName = await downloadImage(pageUrls[i], pagesDir, pageNum);
            const imagePath = `/uploads/pages/${chapterId}/${fileName}`;
            db.prepare('INSERT INTO pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)').run(chapterId, pageNum, imagePath);
            saved.push(imagePath);
            if (onProgress) onProgress(i + 1, pageUrls.length);
        } catch (err) {
            console.error(`Failed to download page ${pageNum} of chapter ${chapterId}:`, err.message);
        }
    }
    return saved;
}