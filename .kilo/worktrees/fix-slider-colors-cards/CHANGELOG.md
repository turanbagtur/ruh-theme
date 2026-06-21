# Changelog

Tüm önemli değişiklikler bu dosyada belgelenmiştir.

---

## [v2.2.7] — 2026-06-12 (Kırk Beşinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Medya — Kullanıcı Görselleri tekrar tekrar gelmesi**: `list-media` API'sinde `/default-avatar.png`, `/avatar.png`, `/default-cover.png` gibi sistem varsayılan görselleri artık kullanıcı görselleri listesine dahil edilmiyor. Bu dosyalar DB'de yeni kayıtlı her kullanıcıya varsayılan olarak atandığı için silinse bile yeni kullanıcılarla geri geliyordu.
- **Medya — Sistem görsellerini silme engeli**: `delete-media` API'sine koruma eklendi. Sistem varsayılan yolları (`/default-avatar.png` vb.) artık fiziksel olarak silinemiyor, sessizce geçiliyor.

---

## [v2.2.6] — 2026-06-12 (Kırk Dördüncü Yayın)

### ✨ İyileştirmeler

- **Seri Detay — Bölümler Kutusu**: Tüm bölümler artık scroll edilebilir sabit yükseklikte kutu içinde gösteriliyor (ilk 20 sınırı kaldırıldı). "Tümünü Göster" butonu scroll yerine uzun liste görünümüne geçiyor; "Daralt" ile scroll moduna dönülüyor. Her iki mod da tüm bölümleri listeler.

---

## [v2.2.5] — 2026-06-12 (Kırk Üçüncü Yayın)

### 🐛 Hata Düzeltmeleri

- **Admin Seri Detay — Bölüm Sıralaması**: Admin panelinde seri bölümleri artık en son eklenen önce (DESC) sıralanıyor. Önceden ilkten sona (ASC) gidiyordu, şimdi 3-2-1 şeklinde listeleniyor.

---

## [v2.2.4] — 2026-06-12 (Kırk İkinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Medya — Kullanıcı Görseli Silme (400 hatası)**: `delete-media` API path validation genişletildi. `/uploads/` dışında `/avatars/` veya farklı formatlarda saklanan yollar da artık kabul ediliyor; path traversal koruması korundu.
- **Medya — Kullanıcı Görseli Boyutu/Tarihi**: Kullanıcı avatar ve kapak görselleri için gerçek dosya istatistikleri (`fs.statSync`) artık liste-media API'sinde hesaplanıyor. Yerel dosyalar için gerçek boyut ve tarih gösteriliyor; harici URL'ler için "Harici" etiketi.
- **Custom Rol API**: `create-custom-role`, `delete-custom-role`, `list-custom-roles` ve `change-user-role` action'ları `/api/admin/users` route'una eklendi. Custom rol isimleri `users.role` alanına atanabiliyor.
- **Özel Rol Yetki Genişletmesi**: `change-role` işleminde özel roller de geçerli rol listesine dahil ediliyor.
- `delete-media` API yanıtına `success: true` eklendi — bulk delete başarı sayacı doğru hesaplanıyor.

---

## [v2.2.3] — 2026-06-12 (Kırk Birinci Yayın)

### 🎨 Tasarım İyileştirmeleri

- **Glassmorphism Card (Son Güncellemeler)**: Cam efekti baştan düzenlendi — `backdrop-filter: blur(16px) saturate(1.4)`, üst kenar parlaması (`::after` highlight şeridi), kapak görseli `object-position: center top` ile düzeltildi ve `align-self: flex-start` eklendi. Hover'da kapak hafifçe yukarı kayıyor. Mobil: `backdrop-filter` kaldırıldı, kapak boyutu optimize edildi, başlık 2 satıra taşıyor.
- **Bağış Bar**: Üst kenar gradyan şeridi (`::before`), butonlarda parlama sweep animasyonu (`::after`), daha güçlü glow orbs, iyileştirilmiş button box-shadow, tüm renk ve geçiş değerleri yenilendi.

### ✨ Yeni Özellikler

- **Seri Detay — Bölümler Kutusu**: İlk 20 bölüm scroll edilebilir kutuda gösterilir. "Tümünü Göster" butonu tüm bölümleri genişletir, "Daralt" ile geri döner. Özel scrollbar stili.
- **Admin Rozetler — SVG İkonlar**: Emoji yerine `BadgeIcon` bileşeni ile çizilmiş 20 adet SVG ikon. İkon dropdown ile seçilir.
- **Admin Rozetler — Renk Düzeltmesi**: Kullanıcıya atanan rozet butonlarında seçili renk doğru yansıtılıyor.
- **Admin Rozetler — Yerleşik Silme**: Varsayılan (yerleşik) rozetler artık silinebilir; silinen ID'ler `deleted_builtin_badges` ayarında saklanır.
- **Admin — Manuel Rol Yönetimi**: "Özel Rol Yönetimi" kartı eklendi. Rol adı, görünen ad, renk seçici ve 15 adet granüler yetki toggle'ı ile özel rol oluşturulabilir; mevcut roller listelenir ve silinebilir.

### 🐛 Hata Düzeltmeleri

- `custom-badges` DELETE API: `builtin=1` parametresi ile yerleşik rozet silme desteği eklendi; silinen rozet tüm kullanıcılardan kaldırılıyor.
- `user-badges` GET/POST: `getAllActiveBadges` ile silinmiş yerleşik rozetler listeden çıkarılıyor.
- `lib/badges.js`: Icon field'ları emoji'den SVG ikon adı string'ine dönüştürüldü.
- Bölüm listesi scroll wrapper'ında `sd-chapter-list-wrap` CSS sınıfı eklendi; özel scrollbar, `scroll-behavior: smooth`.

---

## [v2.2.2] — 2026-06-11 (Kırkıncı Yayın)

### 🐛 Hata Düzeltmeleri

- **Admin medya — Avatarlar & Kullanıcı Görselleri birleştirildi**: "Avatarlar" sekme kaldırıldı. "Kullanıcı Görselleri" artık hem DB'deki avatar/kapak URL'leri hem de `/uploads/avatars/` dizinindeki dosyaları birleşik gösteriyor. Sahipsiz dosyalar altın badge ile işaretleniyor.
- **LazyMediaCard kullanıcı bilgisi**: Kullanıcı görseli kartlarında `@kullanıcıadı` ve görsel tipi (Avatar / Kapak / Sahipsiz) badge olarak gösteriliyor.
- **Keşfet sayfası filtre flash sorunu**: Genre toggle anında `setLoading(true)` çağrısı eklenerek "bulunamadı" flash'ı önlendi.
- **Keşfet hover animasyonları**: `cubic-bezier` spring/bounce kaldırıldı, `ease` geçişe döndürüldü. Kartlar sadece `translateY(-4px)` ile yukarı kalkıyor, sert scale kaldırıldı.
- **next.config.mjs cache uyarısı**: `/_next/static/(.*)` için özel Cache-Control header kaldırıldı (Next.js bunu otomatik yönetiyor).
- **Admin medya — toplu silme FormData sorunu**: `handleBulkDelete` JSON yerine FormData kullanacak şekilde düzeltildi, API ile tutarlı hale getirildi.
- **Medya silme — tek silme sonrası liste yenileme**: `confirmAction` içinde `delete-media` sonrası `loadMedia()` çağrısı eklendi.
- **Upload dropdown**: "Avatarlar" seçeneği kaldırıldı (kullanıcılar kendi profillerinden yönetiyor).

### 🎨 Tasarım İyileştirmeleri

- **Profil Kütüphanem**: Aşırı büyük 3D kart yerine kompakt liste tasarımı — küçük kapak görseli + seri adı, standart admin-card stilinde.
- **Keşfet arka plan**: Gradient hafifletildi, dekoratif orb animasyonsuz basit radial gradient.
- **Glass elementler performans**: `backdrop-filter: blur()` filter bar, genre tags ve load-more butondan kaldırıldı — kasma belirgin biçimde azaltıldı.

---

## [v2.2.1] — 2026-06-11 (Otuz Dokuzuncu Yayın)

### 🐛 Hata Düzeltmeleri

- **Admin medya silme 500 hatası**: `require('sharp')` → `dynamic import('sharp')` ile ES modül uyumlu hale getirildi. `delete-media` handler'ı yeniden yazıldı: harici URL desteği, path normalize/traversal koruması, DB referansı temizleme eklendi.
- **next.config.mjs `/_next/static` cache header uyarısı**: Özel header kaldırıldı.

### ⚡ Performans İyileştirmeleri

- **Keşfet sayfası**: Gereksiz `backdrop-filter`, sert animasyonlar ve ağır gradient kaldırıldı.

---

## [v2.2.0] — 2026-06-11 (Otuz Sekizinci Yayın)

### 🐛 Hata Düzeltmeleri

- **İstatistik barı F5 flash sorunu düzeltildi**: Ana sayfada F5/yenileme sonrası istatistik barı `mounted && !loading` koşuluyla korundu; artık sayfa yenilendikten sonra istatistik kısmı kısa süreliğine görünüp kaybolmuyor.
- **Bildirim sistemi düzeltildi**: Seri isteği durumu güncellendiğinde (`approved`, `rejected`, `reviewing`, `added`) kullanıcıya bildirim gönderilmiyordu. `series-requests` route'una `INSERT INTO notifications` eklendi.
- **Hata bildirimi bildirimleri düzeltildi**: Admin panelde hata bildirimi `rejected`, `resolved` veya `in_progress` yapıldığında kullanıcıya bildirim gönderilmiyordu. `admin/reports` route'una bildirim sistemi eklendi.
- **TrendingWidget Glass3D alt siyah boşluk düzeltildi**: Cam küp seçeneğinde görselin alt kısmında kalan ufak siyah boşluk `.tg-bg` öğesine `background: #111; line-height: 0; font-size: 0` ve img'e `vertical-align: top` eklenerek giderildi.

### ✨ Yeni Özellikler

- **Admin medya paneli — Kullanıcı Görselleri silme**: Daha önce yalnızca indirme yapılabilen "Kullanıcı Görselleri" bölümüne tekli ve toplu silme özelliği eklendi. Diğer kategorilerle tutarlı hale getirildi.
- **Hata bildirimi & seri istek spam koruması**: Her iki API'ye in-memory rate limiting eklendi. Hata bildirimleri: 5 dakikada 3 bildirim. Seri istekleri: 1 saatte 3 yeni istek, 30 saniyede 5 upvote.
- **Seri bölüm listesi kademeli yükleme**: Seri detay sayfasında "Daha Çok Göster" yerine "Daha Fazla Yükle (N kaldı)" butonu ile 20'şer bölüm kademeli yükleme ve "Tümü" butonu eklendi.
- **Profil aktivite grafiği yenilendi**: Son 30 günlük aktivite grafiği yeniden tasarlandı. Tüm 30 günün barı dolu gösteriliyor (boş günler 0 yüksekliğiyle). Aktif gün sayısı, hafta sınırları ve renk gradyanı eklendi.
- **Profil Kütüphanem glassmorphism kartı**: Kütüphanem kartı cam efektiyle yeniden tasarlandı. Seri kapakları büyük 3D görünümde, hover'da scale ve rotate animasyonlarıyla gösteriliyor. Seri eklenebilir sayıda otomatik genişliyor.

### 🎨 Tasarım İyileştirmeleri

- **Keşfet sayfası tam glassmorphism**: Filtreleme barları, genre etiketleri, kart listesi tam glassmorphism tasarımına kavuştu. `backdrop-filter`, cam kenarlıklar, yumuşak gradient arkaplan ve daha akıcı animasyonlar uygulandı.
- **Hover animasyonları yumuşatıldı**: SeriesCard ve glass-series-grid hover geçişleri `cubic-bezier` eğrisiyle yumuşatıldı; pikselleşme sorunu `will-change: transform; backface-visibility: hidden; transform: translateZ(0)` ile giderildi.
- **Favicon WebP desteği iyileştirildi**: Favicon yüklemede `assetType === 'favicon'` olduğunda PNG formatına dönüştürülüyor. Metadata'da WebP MIME türü açıkça belirtiliyor, PNG fallback eklendi.

### ⚡ Performans İyileştirmeleri

- **Next.js yapılandırması optimize edildi**: `compress: true`, `images.minimumCacheTTL: 2592000`, `stale-while-revalidate` cache başlığı ve `/_next/static/` immutable cache eklendi.
- **Aktivite grafiği API sorgu düzeltildi**: Günlük aktivite verisi API tarafında 30 günlük boşluksuz dizi olarak doldurularak frontend hesabı azaltıldı.

---

## [v2.1.0] — 2026-06-11 (Otuz Yedinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Admin panel CPU/RAM %0 sorunu düzeltildi**: `/api/admin/stats` endpoint'i CPU ve RAM kullanımı döndürmüyordu. `os` modülü ile 100ms örnekleme yapan CPU ölçümü ve toplam/boş bellek hesabı eklendi. Artık gerçek zamanlı işlemci ve bellek yüzdesi ile ilerleme çubukları gösteriliyor.
- **Kütüphane "Shadow Ronin" görseli sorunu düzeltildi**: SeriesCard, profile ve admin panelde kapak görseli olmayan seriler için `/demo/cover1.jpg` (Shadow Ronin kapağı) geri dönüş görseli kullanılıyordu. Tüm bu referanslar nötr SVG placeholder ile değiştirildi.
- **Profil kapak görseli kaymış hizalama düzeltildi**: Kapak görseli `backgroundPosition: 'center top'` nedeniyle merkeze oturmuyordu. `center center` yapıldı; imageOptimizer'da da `fit: cover, position: centre` zaten doğruydu.
- **Bölüm okuyucu "Ana Sayfa" butonu düzeltildi**: Bölüm sayfasının sonundaki "Ana Sayfa" butonu mevcut sayfanın en üstüne gidiyordu, ana sayfaya değil. `useRouter` hook'u EndChapterCard bileşenine eklendi ve `router.push('/')` ile doğru navigasyon sağlandı.
- **Favicon düzeltildi**: Özel favicon ayarlandıktan sonra varsayılan favicon görünmeye devam ediyordu. Metadata yapılandırması düzeltildi.

### ✨ Yeni Özellikler

- **Bölüm sayfasına hata bildirme özelliği**: Bölüm okuma sayfasında "Hata Bildir" butonu eklendi. Kullanıcılar bölümdeki sorunları bildirebilir. Admin panelde "Hata Bildirimleri" sekmesinde tüm bildirimler görüntülenebilir ve yönetilebilir.
- **Bakım modu Glassmorphism tasarımı**: Bakım modu için modern cam efekti veren Glassmorphism tasarımı eklendi. Admin panelden "Varsayılan" veya "Glassmorphism" arasında seçim yapılabilir.
- **Rol güncellemeleri ve rozet sistemi**: "Ekip Üyesi" rolü "Yükleyici" olarak yeniden adlandırıldı. Kullanıcılara özel rozetler (VIP, Çevirmen, Yükleyici, Destekçi, Öncü, Doğrulanmış) admin panelden verilebilir. Rozetler yorumlarda ve profil sayfasında görünür.
- **Giriş/Kayıt form metni ayarlanabilir**: Giriş ve kayıt sayfalarındaki alt başlıklar admin panelden özelleştirilebilir.
- **Medya indirme ve kullanıcı görselleri**: Medya yönetiminde tek ve toplu seçim ile indirme özelliği eklendi. "Kullanıcı Görselleri" kategorisi eklendi (profil ve kapak görselleri).
- **Admin panel reklam yönetimi**: Admin panele "Reklamlar" sekmesi eklendi. Popup, üst banner, yan panel, bölümler arası ve alt banner reklam kodları yönetilebilir.
- **Son güncellemeler renk ayarları**: Son güncellemeler bölümünün renkleri (başlık, kart arka planı, badge vb.) admin panelden özelleştirilebilir.
- **Manga keşfet sayfası Glassmorphism tasarımı**: Tüm serilerin olduğu sayfa modern cam efekti ile yeniden tasarlandı. Animated gradient background, glass filter bar, glass genre tags özellikleri eklendi.

### 🔧 İyileştirmeler

- **Sunucu kaynak kartlarına ilerleme çubukları eklendi**: CPU ve RAM kutucuklarına renkli progress bar eklendi. RAM detayı (kullanılan/toplam) gösteriliyor.
- **DB migrations eklendi**: `login_streak`, `last_streak_date` kolonları users tablosuna migrate ediliyor.
- **Site stay API**: `/api/users/site-stay` (POST) endpoint'i eklendi. Rate limit: 20 req/dk. Günlük maksimum 60 dakika takibi.
- **Glassmorphism kart tasarımı eklendi**: Ana sayfadaki "Neon Pulse - Gradient Glow" (style6) tasarımı kaldırıldı, yerine cam efektli modern `GlassmorphismCard` bileşeni eklendi. `backdrop-filter: blur`, şeffaf sınır, glow efekti ve hover animasyonları içeriyor.
- **Bölüm listesi sayfalaması**: Admin panelde bir serinin bölüm listesi çok uzadığında sayfalama özelliği eklendi.
- **Günlük görevler (quests) genişletildi**: 3 görevden 13 göreve çıkarıldı.

---

## [Unreleased] — 2026-06-10 (Otuz Altıncı Yayın)

### 🐛 Hata Düzeltmeleri

- **Yedekleme 500 hatası düzeltildi**: `/api/admin/backup?action=create` endpoint'i `reading_lists` gibi henüz mevcut olmayan tablolara erişince 500 hatası veriyordu. Tüm tablo sorguları artık güvenli `safeQuery` yardımcısıyla sarıldı; var olmayan tablolar sessizce boş dizi döndürüyor.
- **Cam küp slider (Glass 3D) görsel hatası düzeltildi**: `trend_style4` (Cam Küp 3D) tasarımında görsel küpü tam doldurmuyordu ve uzun seri adları görselin üstüne taşarak kapak resmini gizliyordu. `object-fit: cover; object-position: center top` ve 2 satır text-clamp eklendi; 3D `translateZ` overflow sorunu kaldırıldı.
- **Arama çubuğu kenar taşması düzeltildi**: Arama sonuçları hem masaüstünde hem mobilde ekran kenarlarına yapışıyordu. Search overlay ve container responsive padding ile düzeltildi.

### ✨ Yeni Özellikler

- **Zamanlayıcılı bölüm yükleme**: Bölüm eklerken "Zamanlanmış Yayın" tarih/saat alanı eklendi. `publish_at` DB sütunu migrate edildi. Ayarlanan zamana kadar bölüm okuyuculara gösterilmez.
- **Site trafiği izleme (Analytics)**: Admin panele "Site Trafiği" sekmesi eklendi. Günlük ziyaret, benzersiz ziyaretçi, en çok ziyaret edilen sayfalar ve yeni üye grafikleri gösteriliyor. `TrafficTracker` bileşeni otomatik olarak her sayfa değişimini kaydediyor.
- **Tür (genre) yönetimi ve silme**: Admin panele "Türler" sekmesi eklendi. Özel tür eklenebilir ve silinebilir. Silinen tür tüm serilerden otomatik kaldırılır.
- **Rol açıklamaları ve yetki tablosu**: Türler sekmesinde her rolün (Admin, Yönetici, Moderatör, Ekip Üyesi, Kullanıcı) sahip olduğu yetkiler görsel olarak listelenmiştir.
- **Kullanıcı şifre sıfırlama**: Admin paneli kullanıcılar tablosunda her kullanıcı için şifre sıfırlama butonu eklendi. Yeni şifre belirlendikten sonra `/api/admin/users` üzerinden bcrypt ile hashlenip kaydediliyor.
- **Kullanıcı aktivite ve log görüntüleme**: Kullanıcı satırında "Aktivite" butonuna tıklayınca kullanıcının son aktiviteleri, yorum/favori/okuma istatistikleri ve admin logları gösteriliyor.
- **Ana sayfa istatistikler barı toggle**: Ayarlar sekmesine "Ana Sayfa İstatistikler Barını Göster" checkbox'ı eklendi. `show_stats_bar` ayarı DB'ye seed edildi.
- **Denetim kaydı (Audit Log)**: Admin panele "Denetim Kaydı" sekmesi eklendi. Tüm admin işlemleri (seri ekleme/silme, rol değişikliği, şifre sıfırlama vb.) zaman damgasıyla listeleniyor.
- **Trafik kaydı API**: `POST /api/admin/traffic` bot kontrolü yaparak her sayfa görüntülenmesini hashlenmiş IP + tarih bazlı benzersiz ziyaretçi olarak kaydediyor.

### 🔧 İyileştirmeler

- **`user_activity_log` tablosu eklendi**: Kullanıcı aktivitelerini izlemek için veritabanı migrate edildi.
- **`site_traffic_log` tablosu eklendi**: Trafik takibi için veritabanı migrate edildi.
- **`custom_genres` tablosu eklendi**: Özel tür yönetimi için veritabanı migrate edildi.
- **Bölüm API `publish_at` desteği**: `INSERT INTO chapters` sorgusu artık `publish_at` sütununu da kaydediyor.

---

## [Unreleased] — 2026-06-10 (Otuz Beşinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Trend otomatik kaydırma mobil hatası düzeltildi**: Mobilde otomatik kaydırma açıkken 5'ten başlayıp 9'a kayan sonra tık diye tekrar 5'e atlayan hata giderildi. Mobilde de triple list kullanılarak kesintisiz kaydırma sağlandı. Dokunma sonrası pozisyon senkronizasyonu iyileştirildi.
- **Kayıt formu site ismi düzeltildi**: Kayıt formundaki "YomiTranslate'e katılın" sabit metni, artık veritabanından dinamik olarak site ismini çekiyor.
- **Türkçe karakter desteği eklendi**: Kayıt formunda kullanıcı adı alanında Türkçe karakterler (ç, ğ, ı, ö, ş, ü vb.) artık kabul ediliyor. Önceden "halıadam" gibi isimler "sembol kullanmayın" hatası veriyordu.
- **Yorum sayısı düzeltildi**: Bir yoruma yanıt yazıldığında toplam yorum sayısında yanıtların da sayılması sağlandı. Önceden 1 yorum + 2 yanıt = toplam 1 gösteriliyordu, artık 3 gösteriliyor.
- **Seri ismi/kapak hatası düzeltildi**: Kütüphaneye veya okuma listesine seri eklerken, kapak görseli ve seri isminin yanlış gösterilmesi ("shadow ronin" gibi) sorunu giderildi. API'lerin artık `cover_image` ve `slug` alanlarını da döndürmesi sağlandı.

### ✨ Yeni Özellikler

- **Profil resmi önizleme ve kırpma**: Profil ve kapak resmi seçildikten sonra önizleme gösteriliyor. Kaydet butonuna basana kadar kayıt yapılmıyor. Manuel kırpma kontrolleri (yukarı/aşağı/sağ/sol kaydırma, yakınlaştır/uzaklaştır) eklendi.
- **Profil resmi değişiklik limiti**: 24 saatte en fazla 2 kez profil resmi veya kapak resmi değiştirilebilir. Önceden 1 kez limiti vardı. Kullanıcıya kalan değişiklik hakkı ve bekleme süresi gösteriliyor.
- **Admin panel yedekleme bölümü**: Yedek oluşturma, mevcut yedekleri görüntüleme, indirme, silme ve dışa/içe aktarma özellikleri eklendi. Son 7 yedek otomatik tutuluyor.
- **Admin panel sunucu kaynak kullanımı**: Dashboard'a CPU kullanımı, RAM kullanımı, depolama ve yedek boyutu kartları eklendi.
- **Seri arama iyileştirmesi**: Arama kutusu artık tam genişliğe yayılıyor, arama ikonu ve arama butonu eklendi. Tasarım iyileştirildi.

### 🔧 İyileştirmeler

- **Kayıt formu**: Site ismi artık dinamik olarak veritabanı ayarlarından çekiliyor.
- **Profil resmi/kapak**: Seçim sonrası otomatik kayıt kaldırıldı, artık "Kaydet" butonuna basmak gerekiyor.

---

## [Unreleased] — 2026-06-09 (Otuz Dördüncü Yayın)

### ✨ Yeni Özellik

#### Kullanıcı Puanlama Sistemi (1–10 Yıldız)

- **`user_ratings` tablosu** `lib/db.js` migration'ına eklendi: `series_id`, `user_id`, `rating` (1–10), `UNIQUE(series_id, user_id)` kısıtı.
- **`/api/series/rate` endpoint'i** (`GET` / `POST` / `DELETE`) oluşturuldu: kullanıcılar seriye 1–10 arası puan verebilir; puan güncellendiğinde `series.rating` ortalaması otomatik yeniden hesaplanır.
- **SeriesDetailClient.js**: Seri detay sayfasına yıldız satırı (10 yıldız) eklendi. Üzerine gelindiğinde hover vurgusu, tıklanınca kayıt; giriş yapılmamışsa uyarı mesajı gösterilir.
- **`app/series-detail.css`**: `.sd-user-rating-wrap`, `.sd-star-btn`, `.sd-r