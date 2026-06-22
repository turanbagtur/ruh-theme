# 🚀 Ruh Theme — Sunucu Kurulum & Yayınlama Rehberi

> [!WARNING]
> **ÖNEMLİ BİLGİLENDİRME:** Bu rehberdeki komutlarda ve dosyalarda (`.env.local`, Nginx ayarları, klasör yolları vb.) yer alan **`ruhtheme.com`** ve **`ruh-theme`** ifadeleri tamamen birer *örnektir*. Komutları kendi sunucunuzda çalıştırırken bu kısımları **kendi satın aldığınız alan adınız (domain)** ile değiştirmeyi kesinlikle unutmayın. Kopyala-yapıştır yaparken dikkatli olun, aksi takdirde uygulamanız çalışmayacaktır.

Bu rehber, Ruh Theme uygulamasını sıfırdan bir Ubuntu/Debian Linux VPS sunucusuna kurup yayınlamayı adım adım anlatır. Her adımı sırayla uygula.

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
cd ruh-theme
```

### Yöntem B — SCP ile (Git yoksa)

Kendi Windows bilgisayarından PowerShell ile sunucuya kopyala:
```powershell
scp -r "C:\Users\KULLANICI_ADINIZ\ruh-theme" root@SUNUCU_IP:/var/www/ruh-theme
```

Sonra sunucuda:
```bash
cd /var/www/ruh-theme
```

> ⚠️ **ÖNEMLİ:** `.env.local` dosyasını Git'e asla yükleme! `.gitignore` zaten bu dosyayı hariç tutuyor. Sunucuda ayrıca oluşturacağız.

---

## 5️⃣ Ortam Değişkenlerini Ayarlama

Sunucuda `.env.local` dosyasını oluştur:
```bash
cd /var/www/ruh-theme
nano .env.local
```

Aşağıdaki içeriği olduğu gibi yapıştır (`Ctrl+Shift+V` ile), sonra değerleri düzenle:

```env
# Next.js ortam
NODE_ENV=production

# JWT Secret — kullanıcı oturumları için
# Aşağıdaki komutla güçlü bir değer üret:
# openssl rand -hex 32
JWT_SECRET=BURAYA_COK_GUCLU_RASTGELE_BIR_DEGER_YAZ

# Veritabanı yolu (değiştirme)
DATABASE_PATH=./data/manga.db

# Sitenin tam URL'i
NEXT_PUBLIC_BASE_URL=https://ruhtheme.com
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
mkdir -p /var/www/ruh-theme/data
mkdir -p /var/www/ruh-theme/public/uploads/covers
mkdir -p /var/www/ruh-theme/public/uploads/pages
mkdir -p /var/www/ruh-theme/public/uploads/avatars

# Yedekleme klasörü
mkdir -p /root/backups

# İzinleri ayarla
chown -R www-data:www-data /var/www/ruh-theme/public/uploads
chown -R www-data:www-data /var/www/ruh-theme/data
chmod -R 755 /var/www/ruh-theme/public/uploads
```

---

## 7️⃣ Bağımlılıkları Yükle & Derle

```bash
cd /var/www/ruh-theme

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
cd /var/www/ruh-theme
pm2 start npm --name "ruh-theme" -- start
```

### 8.3 — Uygulamanın çalıştığını kontrol et
```bash
pm2 status
```
`ruh-theme` yanında `online` yazmalı.

```bash
pm2 logs ruh-theme --lines 20
```
Hata yoksa devam et.

### 8.4 — Sunucu yeniden başladığında otomatik başlat
```bash
pm2 startup systemd
```

> **Root kullanıcısıysanız (önerilen):** PM2 gerekli komutları otomatik çalıştırır. Çıktıda `[v] Command successfully executed` görürseniz herhangi bir şey yapıştırmanıza gerek yok, doğrudan `pm2 save` adımına geçin.
>
> **Root olmayan kullanıcıysanız:** Komut çalıştıktan sonra çıktının en altında `sudo env PATH=...` ile başlayan bir satır görürsünüz. O satırı olduğu gibi kopyalayıp terminale yapıştırıp çalıştırın.

Sonra her iki durumda da:
```bash
pm2 save
```

### PM2 Günlük Kullanım Komutları
```bash
pm2 status                    # Durum kontrolü
pm2 logs ruh-theme        # Anlık loglar
pm2 logs ruh-theme --lines 100   # Son 100 satır log
pm2 restart ruh-theme     # Yeniden başlat
pm2 stop ruh-theme        # Durdur
pm2 delete ruh-theme      # Tamamen kaldır
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
nano /etc/nginx/sites-available/ruh-theme
```

Aşağıdaki konfigürasyonu olduğu gibi yapıştır:

```nginx
server {
    listen 80;
    server_name ruhtheme.com www.ruhtheme.com;

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

        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
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
        alias /var/www/ruh-theme/public/uploads/;
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
ln -s /etc/nginx/sites-available/ruh-theme /etc/nginx/sites-enabled/

# Konfigürasyonu test et
nginx -t
```
`syntax is ok` ve `test is successful` görmelisin.

```bash
systemctl restart nginx
systemctl enable nginx
```

Artık siteye `http://ruhtheme.com` adresinden erişebilirsin!

---

## 🔟 SSL Sertifikası (HTTPS) — Let's Encrypt

> ⚠️ Bu adım için DNS ayarları sunucunun IP adresini gösteriyor olmalı. DNS yayılması 5-30 dakika sürebilir.

### 10.1 — Certbot kur
```bash
apt install -y certbot python3-certbot-nginx
```

### 10.2 — SSL sertifikası al
```bash
certbot --nginx -d ruhtheme.com -d www.ruhtheme.com
```

Certbot sıraya şunları soracak:
1. **E-posta adresi** → `ruh-theme@gmail.com` yaz (sertifika yenileme bildirimleri için)
2. **Şartları kabul ediyor musun?** → `A` (Agree)
3. **E-posta paylaşımı** → `N` (No)
4. **HTTP'yi HTTPS'e yönlendir mi?** → `2` (Redirect) seç

Certbot otomatik olarak Nginx konfigürasyonunu HTTPS'e günceller.

### 10.3 — Otomatik yenilemeyi test et
```bash
certbot renew --dry-run
```
`Congratulations, all simulated renewals succeeded` görmelisin.

Artık siteye `https://ruhtheme.com` adresinden **güvenli** erişilebilir.

---

## 1️⃣1️⃣ İlk Admin Hesabı

Uygulama ilk çalıştırıldığında veritabanı otomatik oluşturulur.

İlk kurulumda `lib/seed.js` dosyasında tanımlı seed verileri ile bir admin hesabı oluşturulur.

> ⚠️ **GÜVENLİK UYARISI:** Seed admin hesabının e-posta ve şifresini **kurulumdan hemen sonra** değiştir.  
> Varsayılan kimlik bilgilerini burada belirtmiyoruz — `lib/seed.js` dosyasına bak ve deploy öncesi güçlü bir şifre ile değiştir.  
> Profil sayfasına giderek hesap bilgilerini güncelle.

> 🚨 **Varsayılan şifreyle production'a çıkma!** Hesap ele geçirilirse tüm site verilerine erişim sağlanabilir.

Admin paneline şuradan eriş: `https://ruhtheme.com/admin-panel`

---

## 🔍 Google Search Console & Indexing API Kurulumu

Bu bölüm, sitenin Google'da daha hızlı indekslenmesi için gerekli entegrasyonu anlatır. İki ayrı adım vardır: site doğrulama ve otomatik indeksleme.

> 💡 **Başlamadan önce oku — Mülk Tipi Farkı:**
>
> Search Console'da iki farklı mülk tipi vardır:
> - **Alan Adı** → `siteni.com` şeklinde, protokolsüz eklenir. DNS kaydıyla doğrulanır.
> - **URL Öneki** → `https://siteni.com` şeklinde, protokol ile eklenir. HTML etiketiyle doğrulanabilir.
>
> **Google Indexing API yalnızca URL Öneki mülkleriyle çalışır.**  
> Alan Adı mülküne servis hesabı "Sahip" olarak eklenemez; eklenmeye çalışılsa bile 403 hatası alınır.  
> Bu nedenle mülkünü mutlaka **URL Öneki** olarak oluşturman gerekir.

---

### Adım 1 — Google Search Console'da Site Doğrulama

1. [Google Search Console](https://search.google.com/search-console)'a git
2. **Mülk Ekle** butonuna tıkla
3. Açılan pencerede **sağdaki "URL öneki"** kutusunu seç (soldaki "Alan adı" değil!)
4. `https://sitenizinadi.com` yaz (başında `https://` olmalı) → **Devam**
5. Doğrulama yöntemi olarak **HTML etiketi**'ni seç
6. Şu şekilde bir kod göreceksin:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXXXX" />
   ```
7. Yalnızca `content="..."` içindeki değeri kopyala (tırnak işaretleri olmadan)
8. **Admin Paneli → Özelleştir → Analitik** bölümüne git
9. **"Google Search Console Doğrulama Kodu"** alanına yapıştır ve kaydet
10. Search Console'a dön → **Doğrula** butonuna bas

> ⚠️ Daha önce "Alan Adı" mülkü oluşturduysan silmene gerek yok — yeni URL Öneki mülkü ayrıca ekle, ikisi yan yana çalışır.

---

### Adım 2 — Google Indexing API (Otomatik Bölüm İndeksleme)

Yeni manga bölümü eklendiğinde Google'ın otomatik olarak haberdar edilmesi için bir **Service Account** anahtarı gerekir.

#### 2.1 — Google Cloud Projesi Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/)'a git
2. Üstte proje seçiciye tıkla → **Yeni Proje** oluştur (ad: `ruh-theme-indexing`)
3. Proje oluşturulduktan sonra o projeyi seç

#### 2.2 — Web Search Indexing API'yi Etkinleştir

1. Sol menü → **API'ler ve Hizmetler → Kitaplık**
2. Arama kutusuna **"Web Search Indexing API"** yaz
3. Çıkan sonuca tıkla → **Etkinleştir** butonuna bas

> ⚠️ Bu adımı atlarsan `HTTP 403 - API has not been used` hatası alırsın.

#### 2.3 — Service Account Oluştur

1. Sol menü → **API'ler ve Hizmetler → Kimlik Bilgileri**
2. **+ Kimlik Bilgisi Oluştur → Service Account** seç
3. Ad: `indexing-bot` yaz → **Oluştur ve Devam Et**
4. Rol atama adımını **Atla** (Search Console'dan verilecek)
5. **Bitti** butonuna bas

#### 2.4 — JSON Anahtarı İndir

1. Az önce oluşturduğun servis hesabına tıkla
2. Üstte **Anahtarlar** sekmesine geç
3. **Anahtar Ekle → Yeni Anahtar Oluştur → JSON** seç → **Oluştur**
4. `proje-adı-xxxxxxx.json` adında bir dosya indirilir — **güvende tut, asla Git'e commit'leme!**

#### 2.5 — Service Account'u Search Console'a Sahip Olarak Ekle (EN KRİTİK ADIM)

> ⚠️ **Bu adım yanlış yapılırsa `HTTP 403 - Permission denied. Failed to verify the URL ownership` hatası alırsın.**
>
> **Yaygın hata:** Mülkünü "Alan Adı" (`siteni.com`, protokolsüz) olarak oluşturduysan servis hesabını oraya Sahip olarak **ekleyemezsin** — Google bu tipi desteklemiyor. Bu nedenle Adım 1'de **URL Öneki** (`https://siteni.com`) mülkü oluşturulması şarttır.

Adımlar:

1. [Google Search Console](https://search.google.com/search-console)'a git
2. Sol üstteki açılır menüden **URL Öneki mülkünü** seç — `https://siteni.com` formatında olanı
   - Eğer sadece Alan Adı mülkün varsa → Adım 1'e dön, yeni bir URL Öneki mülkü oluştur
3. Sol menü → **Ayarlar → Kullanıcılar ve İzinler**
4. **Kullanıcı Ekle** butonuna tıkla
5. E-posta alanına service account adresini gir:
   - Format: `indexing-bot@proje-adi-xxxxx.iam.gserviceaccount.com`
   - Bu adresi indirdiğin JSON dosyasındaki `"client_email"` alanından kopyalayabilirsin
6. İzin: **Sahip** (Owner) seç → **Ekle**

> ⚠️ **"Okuyucu" veya "Tam Kullanıcı" yetmez** — mutlaka **Sahip** seç.  
> ⚠️ **Hangi mülke eklediğine dikkat et** — Alan Adı ve URL Öneki mülkleri ayrı listelenir; URL Öneki olanı seç.

#### 2.6 — Anahtarı Admin Paneline Yükle

1. **Admin Paneli → Özelleştir → Google Indexing API (Otomatik İndeksleme)** bölümüne git
2. **"Service Account Anahtarı Yükle"** alanından indirdiğin `.json` dosyasını seç
3. Yükleme başarılıysa servis hesabı e-postası yeşil kutuda görünür
4. **Test Et** butonuna bas — `✓ URL başarıyla Google'a bildirildi` mesajını görmelisin

#### 2.7 — Sunucuya Manuel Yükleme (Alternatif)

Admin paneli üzerinden yükleyemezsen doğrudan sunucuya kopyalayabilirsin:

```bash
# Kendi bilgisayarından sunucuya kopyala
scp proje-adı-xxxxxxx.json root@SUNUCU_IP:/var/www/ruh-theme/google-indexing-key.json

# İzin ayarla (Node.js okuyabilsin)
chmod 600 /var/www/ruh-theme/google-indexing-key.json
chown root:root /var/www/ruh-theme/google-indexing-key.json
```

Dosya adı tam olarak `google-indexing-key.json` olmalıdır.

---

#### Sık Karşılaşılan Hatalar ve Çözümleri

| Hata Mesajı | Olası Neden | Çözüm |
|---|---|---|
| `HTTP 403 - API has not been used` | Web Search Indexing API etkinleştirilmemiş | Adım 2.2: Cloud Console'da API'yi etkinleştir |
| `HTTP 403 - Permission denied. Failed to verify URL ownership` | (1) Service account hiç eklenmemiş, (2) **Alan Adı** mülküne eklenmiş (desteklenmiyor), (3) Sahip yerine Okuyucu/Tam Kullanıcı olarak eklenmiş | Adım 1'de **URL Öneki** (`https://...`) mülkü oluştur → Adım 2.5: servis hesabını bu mülke **Sahip** olarak ekle |
| `HTTP 403 - API has not been used in project` | Yanlış Google Cloud projesinde anahtar oluşturulmuş | API'nin etkinleştirildiği projeyle **aynı projeden** anahtar oluştur |
| `OAuth token alınamadı` | JSON dosyası bozuk, alan eksik veya yanlış proje | Yeni anahtar oluştur (Adım 2.4), admin panelinden tekrar yükle |
| `google-indexing-key.json bulunamadı` | Dosya yüklenmemiş veya yanlış konumda | Admin panelinden tekrar yükle; sunucuda `/var/www/ruh-theme/google-indexing-key.json` yolunu kontrol et |
| Search Console doğrulaması başarısız | Site erişilebilir değil veya meta etiketi yanlış/eksik | Sitenin canlıda çalıştığını doğrula; admin panelinden doğrulama kodunu kaydet, sayfayı yenile |

> 💡 **Hızlı Kontrol Listesi:**
> - [ ] Search Console'da **URL Öneki** (`https://...`) mülkü oluşturuldu
> - [ ] Servis hesabı bu **URL Öneki mülküne** — Alan Adı mülküne değil — **Sahip** olarak eklendi
> - [ ] Google Cloud'da **Web Search Indexing API** etkinleştirildi
> - [ ] JSON anahtar dosyası admin paneline yüklendi ve Test Et başarılı çıktı

---

## 🔄 Güncelleme Yapma

Yeni bir versiyon yayınladığında:

```bash
cd /var/www/ruh-theme

# Git kullanıyorsan yeni kodu çek
git pull origin main

# Bağımlılıkları güncelle
npm ci --production=false

# Yeniden derle
npm run build

# Uygulamayı yeniden başlat (sıfır downtime)
pm2 reload ruh-theme
```


## 🛡️ Otomatik Yedekleme

### Manuel yedekleme
```bash
cp /var/www/ruh-theme/data/manga.db /root/backups/manga_$(date +%Y%m%d_%H%M).db
```

### Otomatik günlük yedekleme (her gece saat 03:00'te)
```bash
crontab -e
```
Editör açılır, dosyanın sonuna şu satırı ekle:
```
0 3 * * * cp /var/www/ruh-theme/data/manga.db /root/backups/manga_$(date +\%Y\%m\%d).db 2>/dev/null
```
Kaydet ve çık.

### Yedeklenecek kritik dosyalar
```
/var/www/ruh-theme/data/manga.db        ← Tüm veriler (kullanıcılar, seriler, vs.)
/var/www/ruh-theme/public/uploads/      ← Manga görselleri
/var/www/ruh-theme/.env.local           ← Ortam değişkenleri
/var/www/ruh-theme/backups/             ← Admin panelinden oluşturulan JSON yedekler
```

> **Not:** Cron job `/root/backups/` klasörüne SQLite dosyası kopyalarken, admin paneli yedekleme özelliği `/var/www/ruh-theme/backups/` klasörüne JSON formatında yedek oluşturur. Her iki konumu da yedekle.

---

## 📁 Sunucudaki Klasör Yapısı

```
/var/www/ruh-theme/
├── .env.local           ← Gizli ortam değişkenleri (kimseyle paylaşma!)
├── .next/               ← Derlenmiş Next.js dosyaları
├── data/
│   └── manga.db         ← SQLite veritabanı (yedekle!)
├── public/
│   ├── uploads/
│   │   ├── avatars/     ← Kullanıcı profil görselleri
│   │   ├── covers/      ← Seri kapak görselleri
│   │   └── pages/       ← Manga sayfaları
│   ├── robots.txt       ← SEO — arama motoru kuralları
│   └── manifest.json    ← PWA manifest
├── app/
│   ├── sitemap.xml/     ← Dinamik sitemap (SEO)
│   └── ...              ← Sayfa ve API route'ları
├── components/          ← React bileşenleri
├── lib/                 ← Veritabanı ve auth kütüphaneleri
└── package.json
```

### Dosya İzinleri (Önemli!)
Nginx ve Node.js'in dosyalara erişebilmesi için:
```bash
# Yükleme dizinleri oluştur
mkdir -p /var/www/ruh-theme/public/uploads/{covers,pages,avatars}

# İzinler
chown -R www-data:www-data /var/www/ruh-theme/public/uploads
chmod -R 755 /var/www/ruh-theme/public/uploads
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
pm2 restart ruh-theme
```

### Nginx 502 Bad Gateway hatası
```bash
pm2 status                     # Uygulama çalışıyor mu?
pm2 logs ruh-theme         # Hata mesajına bak
pm2 restart ruh-theme      # Yeniden başlat
```

### 413 Entity Too Large hatası
Nginx konfigürasyonunda `client_max_body_size` değerini artır:
```bash
nano /etc/nginx/sites-available/ruh-theme
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



### Port 3000'ü yanlışlıkla açtıysanız kapatın

Next.js portu olan 3000, internetten erişime **kapalı** olmalıdır — tüm trafik Nginx üzerinden gelmelidir. Yanlışlıkla açtıysanız şu şekilde kapatın:
```bash
ufw deny 3000
ufw reload
ufw status   # 3000 "DENY" görünmeli
```

> ⚠️ Port 3000'ü açık bırakmak, ziyaretçilerin Nginx'i (ve dolayısıyla rate limiting, SSL, cache gibi tüm koruma katmanlarını) atlayarak uygulamaya doğrudan erişmesine izin verir. Her zaman kapalı tutun.

### 522 Connection Timed Out (Cloudflare kullanıyorsan)

9. adımda Nginx kurulumunu tamamladıktan sonra hâlâ `Error 522` alıyorsan sebebi genellikle Cloudflare'in sunucuna ulaşamamasıdır. Sırayla kontrol et:

**1 — Uygulamanın gerçekten çalıştığını doğrula:**
```bash
pm2 status           # ruh-theme "online" olmalı
curl http://127.0.0.1:3000   # Sunucu içinden yanıt vermeli
```

**2 — Nginx'in ayakta olduğunu doğrula:**
```bash
systemctl status nginx
curl http://localhost   # Nginx üzerinden yanıt gelmeli
```

**3 — Güvenlik duvarı 80 ve 443 portlarını açık mı?**
```bash
ufw status
# 80 ve 443 "ALLOW" olmalı
```
Değilse:
```bash
ufw allow 80
ufw allow 443
ufw reload
```

**4 — Cloudflare DNS ayarında proxy aktif mi?**
Cloudflare Dashboard → DNS → A kaydının yanındaki **turuncu bulut** simgesi aktif (Proxied) olmalı. Gri (DNS Only) durumdaysa Cloudflare üzerinden trafik geçmez, 522 alırsın. Buluta tıklayarak "Proxied" yap.

**5 — Cloudflare SSL modunu kontrol et:**
Cloudflare Dashboard → SSL/TLS → Overview moduna bak:

- Sunucunda Let's Encrypt (SSL sertifikası) **yoksa** → mod **`Flexible`** olmalı.
- Sunucunda SSL sertifikası **varsa** → mod **`Full`** olmalı.

> ⚠️ **En sık yapılan hata:** Sunucuda henüz SSL sertifikası yokken modu `Full` veya `Full (Strict)` ayarlamak. Bu durumda Cloudflare sunucudan HTTPS (port 443) bekler, sunucu sadece port 80 dinlediği için bağlantı kurulamaz ve 522 verir.
>
> **Tanı yöntemi:** Cloudflare'de A kaydını geçici olarak `DNS Only` (gri bulut) yapınca site açılıyorsa sorun kesinlikle SSL modu veya Cloudflare proxy ayarıdır, sunucu sağlıklıdır.

**Kurulum sonrası önerilen SSL akışı:**

Adım 1 — Önce Cloudflare'i `Flexible` modda çalıştır, site açılır.

Adım 2 — Ardından sunucuya Let's Encrypt kur:
```bash
certbot --nginx -d yomitranslate.com -d www.yomitranslate.com
```

Adım 3 — Certbot başarılı olduktan sonra Cloudflare → SSL/TLS → `Full` yap.

**6 — Sunucunun Cloudflare IP'lerine açık olduğunu kontrol et:**
Cloudflare trafiği kendi IP aralıklarından gelir. UFW kurallarında belirli IP kısıtlaması yaptıysan Cloudflare IP listesini izin ver:
```bash
# Cloudflare IPv4 aralıkları için toplu izin
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do ufw allow from $ip to any port 80; ufw allow from $ip to any port 443; done
ufw reload
```

Yukarıdakilerin hepsi doğruysa birkaç dakika bekle — DNS değişikliği tam yayılmamış olabilir.

### Cloudflare Turnstile çalışmıyor
Admin panelinde `Settings` sekmesinden `API Keys` bölümüne gir. Turnstile Site Key ve Secret Key'in doğru girildiğini kontrol et. Cloudflare Dashboard'dan `ruhtheme.com` domain'ini whitelist'e aldığından emin ol.

### SSL sertifikası alınamıyor
DNS'in yayıldığından emin ol:
```bash
nslookup ruhtheme.com
# Sunucunun IP adresini dönmeli
```

---

## 📊 Performans Notları

- **SQLite WAL modu**: Otomatik aktif, eş zamanlı okuma/yazma için optimize
- **Statik cache**: Nginx `_next/static` dosyalarını 1 yıl cache'ler
- **Görsel optimizasyon**: `sharp` modülü aktif
- **İstatistikler**: Ana sayfa istatistikleri her 60 saniyede otomatik güncellenir

---

> **Tebrikler!** 🎉 Ruh Theme artık `https://ruhtheme.com` adresinde yayında.  
> Sorun yaşarsan `pm2 logs ruh-theme` komutuyla hata mesajlarına bak.