# 🚀 YomiTranslate — Sunucu Kurulum & Yayınlama Rehberi

Bu rehber, YomiTranslate uygulamasını sıfırdan bir Ubuntu/Debian Linux VPS sunucusuna kurup yayınlamayı adım adım anlatır. Her adımı sırayla uygula.

---

## 📋 Gereksinimler

| Gereksinim | Minimum | Önerilen |
|---|---|---|
| **OS** | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| **RAM** | 1 GB | 2 GB+ |
| **Disk** | 10 GB | 20 GB+ |
| **Node.js** | v18.x | v20.x LTS |
| **npm** | v9.x | v10.x |


> **Sunucu nereden alınır?**  
> Hetzner Cloud (en uygun fiyat), DigitalOcean, Contabo veya Vultr gibi sağlayıcılardan aylık 4–8$ ile başlayan VPS alabilirsin. Ubuntu 22.04 seç.

---

## 0️⃣ Domain DNS Ayarı (Önce Yap)

Domain sağlayıcında (Namecheap, GoDaddy, Cloudflare vs.) DNS yönetimine gir ve şu kayıtları ekle:

| Tür | Host | Değer | TTL |
|---|---|---|---|
| A | `@` | `SUNUCU_IP_ADRESI` | Auto |
| A | `www` | `SUNUCU_IP_ADRESI` | Auto |

DNS yayılması 5–30 dakika sürer. Sunucu kurulumu sırasında yayılmış olur.

---

## 1️⃣ Sunucuya İlk Bağlantı

Sunucunu satın alınca sana bir **IP adresi** ve **root şifresi** verilir.

### Windows'tan bağlanmak için (PowerShell veya Terminal):
```bash
ssh root@SUNUCU_IP_ADRESI
```

Şifren sorulacak, gizli kalacak şekilde yaz ve Enter'a bas.

---

## 2️⃣ Sistem Hazırlığı

Sunucuya bağlandıktan sonra sırayla şu komutları çalıştır:

### 2.1 — Sistem güncelleme
```bash
apt update && apt upgrade -y
```

### 2.2 — Temel araçları yükle
```bash
apt install -y git curl build-essential python3 python3-pip ufw
```

> **Neden gerekli?**  
> `build-essential` ve `python3` → `better-sqlite3` ve `sharp` modüllerinin derlenmesi için zorunlu.

### 2.3 — Node.js v20 LTS kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2.4 — Versiyon kontrolü
```bash
node -v   # v20.x.x görmelisin
npm -v    # 10.x.x görmelisin
```

---

## 3️⃣ Güvenlik Duvarı (UFW) Ayarla

```bash
ufw allow 22      # SSH — bu olmadan sunucuya erişemezsin, MUTLAKA ekle
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw deny 3000     # Next.js portunu internetten gizle (Nginx üzerinden servis edeceğiz)
ufw enable        # Güvenlik duvarını etkinleştir
```

Onay sorduğunda `y` yaz ve Enter'a bas.

```bash
ufw status        # Durumu kontrol et
```

---

## 4️⃣ Proje Dosyalarını Sunucuya Aktarma

### Yöntem A — Git ile (Önerilen)

Eğer projen GitHub/GitLab'da ise:
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/turanbagtur/ruh-theme.git
cd yomitranslate
```

### Yöntem B — SCP ile (Git yoksa)

Kendi Windows bilgisayarından PowerShell ile sunucuya kopyala:
```powershell
scp -r "C:\Users\tbagt\OneDrive\Desktop\ruh-theme" root@SUNUCU_IP:/var/www/yomitranslate
```

Sonra sunucuda:
```bash
cd /var/www/yomitranslate
```

> ⚠️ **ÖNEMLİ:** `.env.local` dosyasını Git'e asla yükleme! `.gitignore` zaten bu dosyayı hariç tutuyor. Sunucuda ayrıca oluşturacağız.

---

## 5️⃣ Ortam Değişkenlerini Ayarlama

Sunucuda `.env.local` dosyasını oluştur:
```bash
cd /var/www/yomitranslate
nano .env.local
```

Aşağıdaki içeriği olduğu gibi yapıştır (`Ctrl+Shift+V` ile), sonra değerleri düzenle:

```env
# Next.js ortam
NODE_ENV=production

# Torii Translate API Anahtarı
# https://toriitranslate.com adresinden alınır
# Admin panelden de eklenebilir, burası opsiyonel
TORII_API_KEY=sk_torii_BURAYA_KENDI_API_ANAHTARINI_YAZ

# JWT Secret — kullanıcı oturumları için
# Aşağıdaki komutla güçlü bir değer üret:
# openssl rand -hex 32
JWT_SECRET=BURAYA_COK_GUCLU_RASTGELE_BIR_DEGER_YAZ

# Veritabanı yolu (değiştirme)
DATABASE_PATH=./data/manga.db

# Sitenin tam URL'i
NEXT_PUBLIC_BASE_URL=https://yomitranslate.com
```

Kaydet ve çık: `Ctrl+X`, ardından `Y`, ardından `Enter`.

### JWT Secret üretmek için:
```bash
openssl rand -hex 32
```
Çıkan 64 karakterlik değeri kopyala ve `JWT_SECRET` kısmına yapıştır.

> 🚨 `JWT_SECRET` değerini asla kimseyle paylaşma. Değişirse tüm kullanıcı oturumları kapanır.

---

## 6️⃣ Veri Klasörlerini Oluştur

```bash
# Veritabanı ve yükleme klasörlerini oluştur
mkdir -p /var/www/yomitranslate/data
mkdir -p /var/www/yomitranslate/public/uploads/covers
mkdir -p /var/www/yomitranslate/public/uploads/pages
mkdir -p /var/www/yomitranslate/public/translations

# Yedekleme klasörü
mkdir -p /root/backups

# İzinleri ayarla
chown -R www-data:www-data /var/www/yomitranslate/public/uploads
chown -R www-data:www-data /var/www/yomitranslate/public/translations
chown -R www-data:www-data /var/www/yomitranslate/data
chmod -R 755 /var/www/yomitranslate/public/uploads
chmod -R 755 /var/www/yomitranslate/public/translations
```

---

## 7️⃣ Bağımlılıkları Yükle & Derle

```bash
cd /var/www/yomitranslate

# Bağımlılıkları yükle
npm ci --production=false

# Production build oluştur
npm run build
```

Bu işlem 2-5 dakika sürebilir. Başarılı olursa şunu görürsün:
```
✓ Compiled successfully
✓ Generating static pages
```

> **Build hatası alırsan:** Aşağıdaki `Sık Karşılaşılan Sorunlar` bölümüne bak.

---

## 8️⃣ PM2 ile Uygulamayı Başlat

PM2, uygulamanın arka planda çalışmasını ve sunucu yeniden başlasa bile otomatik açılmasını sağlar.

### 8.1 — PM2 kur
```bash
npm install -g pm2
```

### 8.2 — Uygulamayı başlat
```bash
cd /var/www/yomitranslate
pm2 start npm --name "yomitranslate" -- start
```

### 8.3 — Uygulamanın çalıştığını kontrol et
```bash
pm2 status
```
`yomitranslate` yanında `online` yazmalı.

```bash
pm2 logs yomitranslate --lines 20
```
Hata yoksa devam et.

### 8.4 — Sunucu yeniden başladığında otomatik başlat
```bash
pm2 startup systemd
```
Bu komut sana bir satır verecek, o satırı kopyala ve çalıştır. Genelde şuna benzer:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```
Sonra:
```bash
pm2 save
```

### PM2 Günlük Kullanım Komutları
```bash
pm2 status                    # Durum kontrolü
pm2 logs yomitranslate        # Anlık loglar
pm2 logs yomitranslate --lines 100   # Son 100 satır log
pm2 restart yomitranslate     # Yeniden başlat
pm2 stop yomitranslate        # Durdur
pm2 delete yomitranslate      # Tamamen kaldır
```

---

## 9️⃣ Nginx Reverse Proxy Kurulumu

Next.js port 3000'de çalışır. Nginx bu portu 80/443'e yönlendirir.

### 9.1 — Nginx kur
```bash
apt install -y nginx
```

### 9.2 — Varsayılan siteyi devre dışı bırak
```bash
rm -f /etc/nginx/sites-enabled/default
```

### 9.3 — Site konfigürasyonu oluştur
```bash
nano /etc/nginx/sites-available/yomitranslate
```

Aşağıdaki konfigürasyonu olduğu gibi yapıştır:

```nginx
server {
    listen 80;
    server_name yomitranslate.com www.yomitranslate.com;

    # Manga sayfaları ve kapak görselleri için yükleme limiti
    client_max_body_size 100M;

    # Proxy buffer ayarları (büyük sayfalar için)
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Çeviri işlemleri uzun sürebilir — timeout'ları yüksek tut
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    # Next.js statik dosyaları — 1 yıl cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Yüklenen görseller — Nginx doğrudan servis etsin
    location /uploads/ {
        alias /var/www/yomitranslate/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }
}
```

Kaydet: `Ctrl+X`, `Y`, `Enter`.

### 9.4 — Siteyi aktifleştir
```bash
ln -s /etc/nginx/sites-available/yomitranslate /etc/nginx/sites-enabled/

# Konfigürasyonu test et
nginx -t
```
`syntax is ok` ve `test is successful` görmelisin.

```bash
systemctl restart nginx
systemctl enable nginx
```

Artık siteye `http://yomitranslate.com` adresinden erişebilirsin!

---

## 🔟 SSL Sertifikası (HTTPS) — Let's Encrypt

> ⚠️ Bu adım için DNS ayarları sunucunun IP adresini gösteriyor olmalı. DNS yayılması 5-30 dakika sürebilir.

### 10.1 — Certbot kur
```bash
apt install -y certbot python3-certbot-nginx
```

### 10.2 — SSL sertifikası al
```bash
certbot --nginx -d yomitranslate.com -d www.yomitranslate.com
```

Certbot sıraya şunları soracak:
1. **E-posta adresi** → `yomitranslate@gmail.com` yaz (sertifika yenileme bildirimleri için)
2. **Şartları kabul ediyor musun?** → `A` (Agree)
3. **E-posta paylaşımı** → `N` (No)
4. **HTTP'yi HTTPS'e yönlendir mi?** → `2` (Redirect) seç

Certbot otomatik olarak Nginx konfigürasyonunu HTTPS'e günceller.

### 10.3 — Otomatik yenilemeyi test et
```bash
certbot renew --dry-run
```
`Congratulations, all simulated renewals succeeded` görmelisin.

Artık siteye `https://yomitranslate.com` adresinden **güvenli** erişilebilir.

---

## 1️⃣1️⃣ İlk Admin Hesabı

Uygulama ilk çalıştırıldığında veritabanı otomatik oluşturulur.

Varsayılan admin hesabı:

| Alan | Değer |
|---|---|
| **URL** | `https://yomitranslate.com/login` |
| **Email** | `admin@yomitranslate.com` |
| **Şifre** | `admin123` |

> 🚨 **GİRİŞ YAPTIKTAN HEMEN SONRA** şifreyi ve e-posta adresini değiştir!  
> Profil sayfasına giderek hesap bilgilerini güncelle.

Admin paneline şuradan eriş: `https://yomitranslate.com/admin-panel`

---

## 🔄 Güncelleme Yapma

Yeni bir versiyon yayınladığında:

```bash
cd /var/www/yomitranslate

# Git kullanıyorsan yeni kodu çek
git pull origin main

# Bağımlılıkları güncelle
npm ci --production=false

# Yeniden derle
npm run build

# Uygulamayı yeniden başlat (sıfır downtime)
pm2 reload yomitranslate
```


## 🛡️ Otomatik Yedekleme

### Manuel yedekleme
```bash
cp /var/www/yomitranslate/data/manga.db /root/backups/manga_$(date +%Y%m%d_%H%M).db
```

### Otomatik günlük yedekleme (her gece saat 03:00'te)
```bash
crontab -e
```
Editör açılır, dosyanın sonuna şu satırı ekle:
```
0 3 * * * cp /var/www/yomitranslate/data/manga.db /root/backups/manga_$(date +\%Y\%m\%d).db 2>/dev/null
```
Kaydet ve çık.

### Yedeklenecek kritik dosyalar
```
/var/www/yomitranslate/data/manga.db        ← Tüm veriler (kullanıcılar, seriler, vs.)
/var/www/yomitranslate/public/uploads/      ← Manga görselleri
/var/www/yomitranslate/public/translations/ ← Çevrilmiş sayfalar
/var/www/yomitranslate/.env.local           ← Ortam değişkenleri
```

---

## 📁 Sunucudaki Klasör Yapısı

```
/var/www/yomitranslate/
├── .env.local           ← Gizli ortam değişkenleri (kimseyle paylaşma!)
├── .next/               ← Derlenmiş Next.js dosyaları
├── data/
│   └── manga.db         ← SQLite veritabanı (yedekle!)
├── public/
│   ├── uploads/
│   │   ├── avatars/     ← Kullanıcı profil görselleri
│   │   ├── covers/      ← Seri kapak görselleri
│   │   └── pages/       ← Manga sayfaları
│   ├── translations/    ← Çevrilmiş sayfalar
│   ├── robots.txt       ← SEO — arama motoru kuralları
│   └── manifest.json    ← PWA manifest
├── app/
│   ├── sitemap.xml/     ← Dinamik sitemap (SEO)
│   └── ...              ← Sayfa ve API route'ları
├── components/          ← React bileşenleri
├── lib/                 ← Veritabanı, auth, çeviri kütüphaneleri
└── package.json
```

### Dosya İzinleri (Önemli!)
Nginx ve Node.js'in dosyalara erişebilmesi için:
```bash
# Yükleme dizinleri oluştur
mkdir -p /var/www/yomitranslate/public/uploads/{covers,pages,avatars}
mkdir -p /var/www/yomitranslate/public/translations

# İzinler
chown -R www-data:www-data /var/www/yomitranslate/public/uploads
chown -R www-data:www-data /var/www/yomitranslate/public/translations
chmod -R 755 /var/www/yomitranslate/public/uploads
chmod -R 755 /var/www/yomitranslate/public/translations
```

---

## ❓ Sık Karşılaşılan Sorunlar

### `better-sqlite3` derleme hatası
```bash
apt install -y build-essential python3
npm rebuild better-sqlite3
npm run build
```

### `sharp` modülü hatası
```bash
npm rebuild sharp
npm run build
```

### Port 3000 zaten kullanılıyor
```bash
lsof -i :3000          # Portu kullanan process'i bul
kill -9 <PID>          # <PID> kısmına numarayı yaz
pm2 restart yomitranslate
```

### Nginx 502 Bad Gateway hatası
```bash
pm2 status                     # Uygulama çalışıyor mu?
pm2 logs yomitranslate         # Hata mesajına bak
pm2 restart yomitranslate      # Yeniden başlat
```

### 413 Entity Too Large hatası
Nginx konfigürasyonunda `client_max_body_size` değerini artır:
```bash
nano /etc/nginx/sites-available/yomitranslate
# client_max_body_size değerini 200M yap
nginx -t && systemctl restart nginx
```

### Build sırasında bellek hatası (küçük VPS'ler için)
Swap alanı ekle:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
Sonra tekrar `npm run build` dene.

### Çeviri dosyaları kaydedilemiyor (Permission hatası)
```bash
chown -R www-data:www-data /var/www/yomitranslate/public/translations
chown -R www-data:www-data /var/www/yomitranslate/public/uploads
chmod -R 755 /var/www/yomitranslate/public/translations
chmod -R 755 /var/www/yomitranslate/public/uploads
pm2 restart yomitranslate
```

### Cloudflare Turnstile çalışmıyor
Admin panelinde `Settings` sekmesinden `API Keys` bölümüne gir. Turnstile Site Key ve Secret Key'in doğru girildiğini kontrol et. Cloudflare Dashboard'dan `yomitranslate.com` domain'ini whitelist'e aldığından emin ol.

### SSL sertifikası alınamıyor
DNS'in yayıldığından emin ol:
```bash
nslookup yomitranslate.com
# Sunucunun IP adresini dönmeli
```

---

## 📊 Performans Notları

- **SQLite WAL modu**: Otomatik aktif, eş zamanlı okuma/yazma için optimize
- **Çeviri cache**: Çevrilen sayfalar veritabanında ve `/public/translations/` klasöründe saklanır. Aynı sayfa tekrar çevrilmez
- **Statik cache**: Nginx `_next/static` dosyalarını 1 yıl cache'ler
- **Görsel optimizasyon**: `sharp` modülü aktif
- **Çeviri concurrency**: Aynı anda 2 paralel çeviri, API limitine takılmaz
- **Proxy timeout**: 300 saniye — büyük bölümlerin çevirisini tamamlar
- **İstatistikler**: Ana sayfa istatistikleri her 60 saniyede otomatik güncellenir

---

> **Tebrikler!** 🎉 YomiTranslate artık `https://yomitranslate.com` adresinde yayında.  
> Sorun yaşarsan `pm2 logs yomitranslate` komutuyla hata mesajlarına bak.
