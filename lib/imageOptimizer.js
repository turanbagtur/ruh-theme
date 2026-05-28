import sharp from 'sharp';

/**
 * Kapak görseli optimize et: max 800x1200, WebP
 * @param {Buffer} inputBuffer - Gelen görsel verisi
 * @param {string} outputPath  - Kaydedilecek dosya yolu (.webp uzantılı olmalı)
 * @returns {Promise<string>}  - Kaydedilen dosyanın yolu
 */
export async function optimizeCoverImage(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');
    await sharp(inputBuffer)
        .resize(800, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(webpPath);
    return webpPath;
}

/**
 * Bölüm sayfası optimize et: max 1200px genişlik, WebP
 * @param {Buffer} inputBuffer - Gelen görsel verisi
 * @param {string} outputPath  - Kaydedilecek dosya yolu (.webp uzantılı olmalı)
 * @returns {Promise<string>}  - Kaydedilen dosyanın yolu
 */
export async function optimizeChapterPage(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');
    await sharp(inputBuffer)
        .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(webpPath);
    return webpPath;
}

/**
 * Avatar optimize et: 200x200 kare, WebP
 * @param {Buffer} inputBuffer - Gelen görsel verisi
 * @param {string} outputPath  - Kaydedilecek dosya yolu (.webp uzantılı olmalı)
 * @returns {Promise<string>}  - Kaydedilen dosyanın yolu
 */
export async function optimizeAvatar(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');
    await sharp(inputBuffer)
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toFile(webpPath);
    return webpPath;
}