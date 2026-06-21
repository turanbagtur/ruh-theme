import sharp from 'sharp';
import fs from 'fs';

/**
 * Giriş buffer'ının WebP olup olmadığını kontrol et
 * WebP magic bytes: 52 49 46 46 __ __ __ __ 57 45 42 50
 */
function isWebPBuffer(buffer) {
    if (!buffer || buffer.length < 12) return false;
    return (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
}

/**
 * Kapak görseli optimize et: max 800x1200, WebP
 */
export async function optimizeCoverImage(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    // Zaten WebP ise metadata'yı kontrol et
    if (isWebPBuffer(inputBuffer)) {
        const meta = await sharp(inputBuffer).metadata();
        const w = meta.width || 0;
        const h = meta.height || 0;
        // Boyutlar sınır içindeyse doğrudan kaydet (yeniden sıkıştırma yapma)
        if (w <= 800 && h <= 1200) {
            fs.writeFileSync(webpPath, inputBuffer);
            return webpPath;
        }
        // Sadece resize gerekiyorsa, yüksek kalite WebP kullan
        await sharp(inputBuffer)
            .resize(800, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(webpPath);
        return webpPath;
    }

    await sharp(inputBuffer)
        .resize(800, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(webpPath);
    return webpPath;
}

/**
 * Bölüm sayfası optimize et: max 1200px genişlik, WebP
 * Opsiyonel watermark ayarları: { enabled, path, position, opacity, scale }
 */
export async function optimizeChapterPage(inputBuffer, outputPath, watermarkOptions = null) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    const hasWatermark = (
        watermarkOptions &&
        watermarkOptions.enabled === '1' &&
        watermarkOptions.path &&
        fs.existsSync(watermarkOptions.path)
    );

    // Zaten WebP ve watermark yoksa
    if (isWebPBuffer(inputBuffer) && !hasWatermark) {
        const meta = await sharp(inputBuffer).metadata();
        const w = meta.width || 0;
        // Genişlik 1200'den küçükse doğrudan kaydet
        if (w <= 1200) {
            fs.writeFileSync(webpPath, inputBuffer);
            return webpPath;
        }
        // Sadece resize gerekiyorsa yüksek kalite kullan
        await sharp(inputBuffer)
            .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(webpPath);
        return webpPath;
    }

    // Resize işlemi
    let pipeline = sharp(inputBuffer)
        .resize(1200, null, { fit: 'inside', withoutEnlargement: true });

    // Watermark uygula (etkinse ve dosya varsa)
    if (hasWatermark) {
        try {
            // Orijinal boyutları al, ardından resize sonrası boyutları hesapla
            const origMeta = await sharp(inputBuffer).metadata();
            const origWidth = origMeta.width || 1200;
            const origHeight = origMeta.height || 1600;

            // fit:'inside', max 1200px genişlik — oran koruyarak hesapla
            let imgWidth, imgHeight;
            if (origWidth <= 1200) {
                imgWidth = origWidth;
                imgHeight = origHeight;
            } else {
                imgWidth = 1200;
                imgHeight = Math.round(origHeight * 1200 / origWidth);
            }

            // Watermark boyutunu hesapla (görsel genişliğinin %si)
            const scalePercent = Math.min(50, Math.max(5, parseInt(watermarkOptions.scale) || 15));
            const wmTargetWidth = Math.round(imgWidth * scalePercent / 100);

            // Watermark opacity (0-100 → 0.0-1.0)
            const opacityPercent = Math.min(100, Math.max(1, parseInt(watermarkOptions.opacity) || 60));
            const opacityFactor = opacityPercent / 100;

            // Watermark'ı yeniden boyutlandır, RGBA raw buffer al
            const wmResized = await sharp(watermarkOptions.path)
                .resize(wmTargetWidth, null, { fit: 'inside', withoutEnlargement: false })
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Alpha kanalını doğrudan çarp (her 4. byte = alpha)
            const { data: rawData, info: rawInfo } = wmResized;
            for (let i = 3; i < rawData.length; i += 4) {
                rawData[i] = Math.round(rawData[i] * opacityFactor);
            }

            // Raw buffer'ı PNG'ye dönüştür (sharp composite için)
            const wmBuffer = await sharp(rawData, {
                raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 }
            }).png().toBuffer();

            const wmInfo = await sharp(wmBuffer).metadata();
            const wmWidth = wmInfo.width || wmTargetWidth;
            const wmHeight = wmInfo.height || 50;

            const margin = 12;

            // Konum hesapla
            let top, left;
            const pos = watermarkOptions.position || 'bottom-right';

            switch (pos) {
                case 'top-left':
                    top = margin; left = margin; break;
                case 'top-center':
                    top = margin; left = Math.round((imgWidth - wmWidth) / 2); break;
                case 'top-right':
                    top = margin; left = imgWidth - wmWidth - margin; break;
                case 'center':
                    top = Math.round((imgHeight - wmHeight) / 2);
                    left = Math.round((imgWidth - wmWidth) / 2); break;
                case 'bottom-left':
                    top = imgHeight - wmHeight - margin; left = margin; break;
                case 'bottom-center':
                    top = imgHeight - wmHeight - margin;
                    left = Math.round((imgWidth - wmWidth) / 2); break;
                case 'bottom-right':
                default:
                    top = imgHeight - wmHeight - margin;
                    left = imgWidth - wmWidth - margin; break;
            }

            // Negatif değerleri düzelt
            top = Math.max(0, top);
            left = Math.max(0, left);

            pipeline = sharp(inputBuffer)
                .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
                .composite([{
                    input: wmBuffer,
                    top,
                    left,
                    blend: 'over'
                }]);

        } catch (wmErr) {
            console.warn('Watermark uygulanamadı, orijinal görsel kaydediliyor:', wmErr.message);
            // Watermark başarısız olursa normal devam et
            pipeline = sharp(inputBuffer)
                .resize(1200, null, { fit: 'inside', withoutEnlargement: true });
        }
    }

    // WebP'den WebP'ye dönüşümde quality: 90 kullan (kayıp daha belirgin)
    const quality = isWebPBuffer(inputBuffer) ? 90 : 85;
    await pipeline.webp({ quality }).toFile(webpPath);
    return webpPath;
}

/**
 * Avatar optimize et: 200x200 kare, WebP
 */
export async function optimizeAvatar(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    // Zaten WebP ve 200x200'den küçükse doğrudan kaydet
    if (isWebPBuffer(inputBuffer)) {
        const meta = await sharp(inputBuffer).metadata();
        if ((meta.width || 0) <= 200 && (meta.height || 0) <= 200) {
            fs.writeFileSync(webpPath, inputBuffer);
            return webpPath;
        }
        await sharp(inputBuffer)
            .resize(200, 200, { fit: 'cover', position: 'centre' })
            .webp({ quality: 90 })
            .toFile(webpPath);
        return webpPath;
    }

    await sharp(inputBuffer)
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toFile(webpPath);
    return webpPath;
}

/**
 * Profil kapak görseli optimize et: 1200x400, WebP
 * Opsiyonel crop parametreleri: { cropX, cropY, cropScale }
 *   cropX / cropY : UI'dan gelen piksel ofseti (önizlemede ×2 çarpanıyla uygulanır)
 *   cropScale     : zoom seviyesi [0.5 – 2.0]
 *
 * Kırpma mantığı:
 *   - Önce orijinal görsel, (fit:'cover' ölçeği × cropScale) kadar büyütülür.
 *   - Ardından kullanıcının seçtiği ofset merkezi dikkate alınarak 1200×400 alan çıkarılır.
 *   - Önizleme CSS transform'u translate(cropX*2, cropY*2) kullandığından burada da ×2 uygulanır.
 */
export async function optimizeProfileCover(inputBuffer, outputPath, cropOptions = {}) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    const cropX = Number(cropOptions.cropX) || 0;
    const cropY = Number(cropOptions.cropY) || 0;
    const cropScale = Number(cropOptions.cropScale) || 1;

    // WebP kalite faktörü: WebP'den WebP'ye dönüşümde daha yüksek kalite kullan
    const quality = isWebPBuffer(inputBuffer) ? 90 : 85;

    // Crop parametresi yoksa basit merkez kırpma yap
    if (cropX === 0 && cropY === 0 && cropScale === 1) {
        // Zaten WebP ve boyutlar uygunsa doğrudan kaydet
        if (isWebPBuffer(inputBuffer)) {
            const meta = await sharp(inputBuffer).metadata();
            if ((meta.width || 0) <= 1200 && (meta.height || 0) <= 400) {
                fs.writeFileSync(webpPath, inputBuffer);
                return webpPath;
            }
        }
        await sharp(inputBuffer)
            .resize(1200, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality })
            .toFile(webpPath);
        return webpPath;
    }

    // Orijinal boyutları al
    const meta = await sharp(inputBuffer).metadata();
    const origW = meta.width;
    const origH = meta.height;

    // 1200×400'ü kaplayacak temel ölçek faktörü (fit:'cover' ile aynı mantık)
    const sf = Math.max(1200 / origW, 400 / origH);

    // Kullanıcının zoom'u en az 1 olmalı (aksi hâlde kırpılacak alan < 1200×400 olur)
    const effectiveCropScale = Math.max(1, cropScale);
    const totalSF = sf * effectiveCropScale;

    const scaledW = Math.round(origW * totalSF);
    const scaledH = Math.round(origH * totalSF);

    // Önizlemede ofset ×2 çarpanıyla uygulanır; sunucu tarafında aynı faktörü kullanıyoruz
    let extractLeft = Math.round(scaledW / 2 - 600 - cropX * 2);
    let extractTop  = Math.round(scaledH / 2 - 200 - cropY * 2);

    // Sınır kontrolü
    extractLeft = Math.max(0, Math.min(scaledW - 1200, extractLeft));
    extractTop  = Math.max(0, Math.min(scaledH - 400,  extractTop));

    await sharp(inputBuffer)
        .resize(scaledW, scaledH, { fit: 'fill' })
        .extract({ left: extractLeft, top: extractTop, width: 1200, height: 400 })
        .webp({ quality })
        .toFile(webpPath);

    return webpPath;
}