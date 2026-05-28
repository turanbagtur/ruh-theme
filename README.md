# Ruh Theme (YomiTranslate)

Ruh Theme, çeviri grupları (Manga, Webtoon, Novel) için geliştirilmiş, yüksek performanslı ve modern bir Next.js okuma platformudur. Hızlı sayfa yüklemeleri, gelişmiş SEO uyumluluğu ve zengin kullanıcı deneyimi sunar.

## Özellikler

- **Gelişmiş Yönetim Paneli:** Serileri, bölümleri, sayfaları, kullanıcıları ve yorumları tek bir yerden kolayca yönetin.
- **Kullanıcı Etkileşimi:** Yorum yapma, favoriye ekleme, okuma listesi oluşturma ve yorumlarda Tenor GIF desteği.
- **Oyunlaştırma (Gamification):** Okudukça ve etkileşime girdikçe kazanılan Yomi Puanları, görevler (quests) ve seviye/rozet sistemi.
- **Rol Tabanlı Erişim (RBAC):** Admin, Manager, Moderator ve Team Member gibi detaylı ve güvenli yetkilendirme sistemi.
- **Performans ve SEO:** Next.js Server Components, App Router, Turbopack, yerleşik görsel optimizasyonu (WebP) ve otomatik Sitemap/Robots.txt.
- **Veritabanı:** Kurulumu ve yönetimi son derece kolay olan yüksek hızlı `better-sqlite3` altyapısı.

## Kurulum ve Çalıştırma (Geliştirici Ortamı)

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)
- npm, yarn, pnpm veya bun

### Kurulum Adımları

1. Repoyu bilgisayarınıza klonlayın:
   ```bash
   git clone https://github.com/turanbagtur/ruh-theme.git
   cd ruh-theme
   ```

2. Gerekli paketleri ve bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirme (Development) sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak siteyi görüntüleyin.

## Yayınlama ve Sunucu Kurulumu (Deployment)

Projeyi gerçek bir sunucuya (VPS) kurmak ve internete açmak için çok kapsamlı bir kurulum rehberi hazırladık. Lütfen projenin ana dizinindeki detaylı **[DEPLOYMENT.md](DEPLOYMENT.md)** dosyasını inceleyin.

Genel olarak Production (Canlı) ortam derlemesi için:
```bash
npm run build
npm run start
```
komutları kullanılır.

## Katkıda Bulunma

Geri bildirimleriniz ve pull request (PR) gönderileriniz her zaman değerlidir! Sistemi daha iyi hale getirmek için Issues kısmından bizimle iletişime geçebilirsiniz.

## Destek Olun ☕

Eğer bu projeyi faydalı bulduysanız ve geliştirmelere destek olmak isterseniz, bana Ko-fi üzerinden bir kahve ısmarlayabilirsiniz:

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/solderet)
