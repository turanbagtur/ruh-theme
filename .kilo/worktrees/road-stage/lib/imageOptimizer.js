import sharp from 'sharp';
import fs from 'fs';

/**
 * WebP dosyası zaten uygun boyutlarda mı kontrol et.
 * Eğer zaten WebP ise ve boyutlar limitlerin içindeyse, yeniden sıkıştırmayı atla.
 * Not: Sadece WebP formatını kontrol eder; PNG/JPG/WebP olabilir ama sadece WebP
 * için optimize etmeme kararı verilir.
 */
async function isWebPAlreadyOptimized(inputBuffer, maxWidth, maxHeight) {
    try {
        const meta = await sharp(inputBuffer).metadata();
        // Sadece WebP formatını kontrol et - WebP'yi WebP'ye çevirmek kalite kaybına neden olur
        if (meta.format !== 'webp') return false;
        // Eğer görsel boyut limitleri içindeyse, yeniden kodlamayı atla
        const widthOk = !maxWidth || (meta.width && meta.width <= maxWidth);
        const heightOk = !maxHeight || (meta.height && meta.height <= maxHeight);
        if (widthOk && heightOk) {
            return true;
        }
    } catch (err) {
        console.warn('isWebPAlreadyOptimized metadata check failed:', err.message);
    }
    return false;
}

/**
 * Kapak görseli optimize et: max 800x1200, WebP
 * Zaten WebP ve boyutlar uygunsa yeniden sıkıştırma yapma.
 */
export async function optimizeCoverImage(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    // Eğer dosya zaten WebP ve boyutlar uygunsa, doğrudan kopyala
    if (await isWebPAlreadyOptimized(inputBuffer, 800, 1200)) {
        fs.writeFileSync(webpPath, inputBuffer);
        return webpPath;
    }

    await sharp(inputBuffer)
        .resize(800, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(webpPath);
    return webpPath;
}

/**
 * Bölüm sayfası optimize et: max 1200px genişlik, WebP
 * Opsiyonel watermark ayarları: { enabled, path, position, opacity, scale }
 *
 * Kalite koruma kuralları:
 * - Görsel zaten WebP, boyutlar uygun ve watermark yok → doğrudan kopyala (kalite korunur)
 * - Görsel zaten WebP ama boyutlar büyük → yeniden boyutlandır (kalite biraz düşer ama kabul edilebilir)
 * - Görsel WebP değil → WebP'ye dönüştür
 *
 * NOT: Görsel zaten WebP ise, tekrar WebP yapmak kalite kaybına neden olur.
 * Bu yüzden sadece boyutlandırma gerekiyorsa sharp'ın resize + WebP çıktısı kullanılır,
 * bu da orijinal WebP'nin yeniden kodlanmasına neden olur ama boyut kontrolü için gereklidir.
 */
export async function optimizeChapterPage(inputBuffer, outputPath, watermarkOptions = null) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    // Eğer watermark yoksa ve dosya zaten WebP ve boyutlar uygunsa, doğrudan kopyala
    // Bu, WebP → WebP yeniden kodlamasını önler ve kalite kaybını engeller
    if (!watermarkOptions || watermarkOptions.enabled !== '1') {
        if (await isWebPAlreadyOptimized(inputBuffer, 1200, null)) {
            fs.writeFileSync(webpPath, inputBuffer);
            return webpPath;
        }
    }

    // Resize işlemi
    let pipeline = sharp(inputBuffer)
        .resize(1200, null, { fit: 'inside', withoutEnlargement: true });

    // Watermark uygula (etkinse ve dosya varsa)
    if (
        watermarkOptions &&
        watermarkOptions.enabled === '1' &&
        watermarkOptions.path &&
        fs.existsSync(watermarkOptions.path)
    ) {
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

    await pipeline.webp({ quality: 85 }).toFile(webpPath);
    return webpPath;
}

/**
 * Avatar optimize et: 200x200 kare, WebP
 * Zaten WebP ise yeniden sıkıştırma yapma.
 */
export async function optimizeAvatar(inputBuffer, outputPath) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    // Check if already WebP and within reasonable size
    if (await isWebPAlreadyOptimized(inputBuffer, 200, 200)) {
        fs.writeFileSync(webpPath, inputBuffer);
        return webpPath;
    }

    await sharp(inputBuffer)
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .webp({ quality: 90 })
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
 *   - NOT: cropX pozitifken görsel sağa kayıyor (önizlemede sol taraf görünür),
 *     bu yüzden extractLeft artmalı (+ işareti kullanılır).
 * Zaten WebP ise yeniden sıkıştırma yapma.
 */
export async function optimizeProfileCover(inputBuffer, outputPath, cropOptions = {}) {
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.webp');

    const cropX = Number(cropOptions.cropX) || 0;
    const cropY = Number(cropOptions.cropY) || 0;
    const cropScale = Number(cropOptions.cropScale) || 1;

    // Eğer dosya zaten WebP ise ve crop yoksa, doğrudan kopyala
    if (cropX === 0 && cropY === 0 && cropScale === 1) {
        if (await isWebPAlreadyOptimized(inputBuffer, 1200, 400)) {
            fs.writeFileSync(webpPath, inputBuffer);
            return webpPath;
        }
        await sharp(inputBuffer)
            .resize(1200, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality: 90 })
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

    // Önizlemede görüntüyü sağa kaydırmak = cropX artışı = sol taraf görünür
    // Bu yüzden extractLeft artmalı → + işareti kullanılır
    let extractLeft = Math.round(scaledW / 2 - 600 + cropX * 2);
    let extractTop  = Math.round(scaledH / 2 - 200 + cropY * 2);

    // Sınır kontrolü
    extractLeft = Math.max(0, Math.min(scaledW - 1200, extractLeft));
    extractTop  = Math.max(0, Math.min(scaledH - 400,  extractTop));

    await sharp(inputBuffer)
        .resize(scaledW, scaledH, { fit: 'fill' })
        .extract({ left: extractLeft, top: extractTop, width: 1200, height: 400 })
        .webp({ quality: 85 })
        .toFile(webpPath);

    return webpPath;
}