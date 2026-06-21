# Changelog

Tüm önemli değişiklikler bu dosyada belgelenmiştir.

---

## [v2.5.5] — 2026-06-14 (Altmış Dördüncü Yayın)

### 🐛 Hata Düzeltmeleri

- **Manga Keşfet — Filtreleme Bugları**: `clearFilters` fonksiyonunda `searchRef.current` sıfırlanmıyordu; temizleme sonrası debounce zamanlayıcısı eski aramayı tekrar tetikleyebiliyordu. Düzeltildi. Genre LIKE sorgusu artık JSON tırnak içi eşleşme (`%"GenreName"%`) kullanıyor — alt-string false-positive hataları giderildi. STATUS_TR map'ine 'current' (Güncel) eklendi.
- **Son Güncellemeler — Mobil Blur**: Yetişkin içerik bluru artık yalnızca `mounted` sonrası ve `s.is_adult === 1` (kesin tip kontrolü) olduğunda uygulanıyor. Auth yüklenme süreci tamamlanmadan blur gösterilmeyecek; giriş yapmış kullanıcılarda yanlış blur oluşmayacak.

### ✨ Yeni Özellikler

- **Seri Detay — Kapak Önizlemesi**: Seri detay sayfasındaki kapak görseline tıklanınca tam ekran lightbox açılıyor. Blur overlay, büyütülmüş görsel ve × kapatma butonu içeriyor. Dışarı tıklayarak da kapatılabiliyor.
- **Seri Detay — Bölümler Glassmorphism Grid**: Bölüm listesi yeniden tasarlandı; artık 3 sütunlu glassmorphism kart grid'i olarak gösteriliyor (tablet 2, mobil 1 sütun). Her kart: bölüm numarası, başlık, okunma sayısı ve tarih içeriyor. Opsiyonel thumbnail görseli de destekleniyor.
- **Bölüm Thumbnail — Küçük Görsel Desteği**: Admin panelinden bölüme thumbnail (küçük görsel) eklenebiliyor. İki mod: Manuel URL girişi veya Oto (seri kapağı kullanılır). `chapter_thumbnails_enabled` ayarı açıkken seri detay bölüm kartlarında görsel gösterilir.
- **Admin Paneli — Thumbnail Aç/Kapat**: Genel Ayarlar'a "Bölüm Küçük Görseli" bloğu eklendi; checkbox ile tüm seri detay sayfalarında thumbnail devre dışı bırakılabilir.
- **Veritabanı Migrasyonu**: `chapters` tablosuna `thumbnail_url TEXT` kolonu eklendi. `app_settings`'e `chapter_thumbnails_enabled` anahtarı eklendi (varsayılan: kapalı).

---

## [v2.5.4] — 2026-06-14 (Altmış Üçüncü Yayın)

### ✨ Yeni Özellikler & İyileştirmeler

- **Son Güncellemeler — 4 Bölüm**: Kartlarda en son 3 yerine 4 bölüm gösterilecek şekilde API güncellendi.
- **Son Güncellemeler — Rozet Tasarımı**: Tür etiketi (Manga/Manhwa vb.) kapak görselinin sol üstünde küçük yarı-şeffaf pill olarak konumlandırıldı. Durum etiketi ise kapak görselinin alt kenarına tam genişlikte renkli bir banner şeklinde eklendi — alt satıra geçme ve çakışma sorunları giderildi. Her durum için belirgin renk: Devam Ediyor yeşil, Tamamlandı mor, Ara Verildi sarı, İptal Edildi kırmızı, Güncel camgöbeği.
- **Son Güncellemeler — Sayfalama**: "Daha Fazla Güncelleme" butonu kaldırıldı, yerine sayfa numarası tabanlı sayfalama sistemi eklendi. Önceki / Sonraki butonları, sayfa numaraları ve "X / Y" göstergesi yer alıyor. Sayfa değiştiğinde ekran otomatik olarak bölümün başına kayıyor.
- **Admin Paneli — Sayfa Başına Seri Ayarı**: Genel Ayarlar bölümüne "Son Güncellemeler — Sayfa Başına Seri" ayarı eklendi. Admin buradan her sayfada kaç seri gösterileceğini belirleyebilir (4–64 arası, varsayılan 16). Değişiklik tüm kullanıcılar için anlık yansır.
- **Veritabanı Migrasyonu**: `app_settings` tablosuna `updates_per_page` anahtarı eklendi, varsayılan değeri `16`.

---

## [v2.5.3] — 2026-06-14 (Altmış İkinci Yayın)

### ✨ Yeni Özellikler & İyileştirmeler

- **PC Layout Genişletme**: Ana sayfa container genişliği 1320px'den 1560px'e çıkarıldı, kenar padding'i 24px'den 20px'e düşürüldü. Navbar ve footer da aynı genişlik değerlerini kullanacak şekilde güncellendi. Geniş ekranlarda "Son Güncellemeler" ve diğer içerikler için daha fazla alan açıldı.
- **Seri Durumu — Türkçe ve Yeni Seçenek**: Admin panelinde seri ekleme/düzenleme formundaki "Status" etiketi "Seri Durumu" olarak güncellendi. Durum seçenekleri Türkçeleştirildi: Ongoing → Devam Ediyor, Completed → Tamamlandı, Hiatus → Ara Verildi, Cancelled → İptal Edildi. Yeni "Güncel" (`current`) seçeneği eklendi.
- **Son Güncellemeler — Renk Kodlu Durum Etiketi**: Ana sayfadaki "Son Güncellemeler" kartlarında kapak görseli üzerindeki durum etiketi artık her duruma özel renk taşıyor. Devam Ediyor → yeşil, Tamamlandı → mor/mavi, Ara Verildi → turuncu, İptal Edildi → kırmızı, Güncel → camgöbeği. Durum etiketi tüm STATUS_TR mapleri (page.js, SeriesDetailClient.js) ile senkronize.
- **Seri Detay Sayfası — Durum Noktası Renkleri**: Seri detay sayfasındaki durum göstergesi yalnızca "ongoing/completed" yerine tüm durumları (`hiatus`, `cancelled`, `current`) ayrı renklerle destekliyor.

---

## [v2.5.2] — 2026-06-14 (Altmış Birinci Yayın)

### 🎨 Glassmorphism Tasarım Güncellemeleri

- **Okuyucu Destek Kartı (Bölüm Sonu)**: Tasarım tamamen elden geçirilerek, tüm temayla uyumlu `rgba(30, 30, 35, 0.6)` renk kodlu, blur ve modern gölgeler içeren Glassmorphism (Cam Efekti) yapısına kavuşturuldu.
- **Ana Sayfa "En Çok Okunanlar" Tasarımı**: Yenilikçi Glassmorphism tasarımı uygulandı. Listenin ilk elemanı büyük bir kapak fotoğrafı ve açıklama ile dikkat çekerken, diğer elemanlar daha minimal glassmorphism satırları halinde sıralanıyor.
- **Ana Sayfa Yeni Bölüm Kart Tasarımı**: Glassmorphism yapısına sadık kalarak kapak görseli sol tarafa, bölümler sağ tarafa hizalandı. Kapak üzerine transparan blur efektli etiketler (tür, durum) ve alt kısıma gradient üzerine başlık eklendi.
- **Yorum Bölümü Tasarımı**: Her yorum için ayrı ayrı glassmorphism kutusu tasarımı uygulandı. Yöneticilerin (Admin) yorumları için tasarıma uyumlu olacak şekilde, dikkat çekici ama göz yormayan kırmızımsı (`rgba(239, 68, 68, 0.15)`) bir cam efekti eklendi.

---

## [v2.5.1] — 2026-06-14 (Altmışıncı Yayın)

### 🧹 Tasarım Alternatifleri Kaldırıldı (Kod Temizliği)

- **Ana Sayfa Yeni Bölüm Kart Tasarımı**: 6 alternatif tasarımdan sadece **Glassmorphism (Cam Efekti)** bırakıldı. Kullanılmayan 5 component dosyası (`ClassicCard`, `CosmicTearCard`, `SkillTreeCard`, `HoloUpdateCard`, `CinematicCard`, `NeonPulseCard`) silindi. `app/page.js` import listesi ve `CardComponent` seçimi sadeleştirildi.
- **Ana Sayfa "En Çok Okunanlar" Tasarımı**: 5 alternatiften sadece **Kademeli Cam (Glass Steps)** bırakıldı. `MostReadWidget.js` içindeki ClassicMR, GoldenCrownMR, CyberpunkMR, AnimeMinimalistMR variant fonksiyonları ve kullanılmayan ikon bileşenleri kaldırıldı.
- **Ana Sayfa "Şu Anda Trend Olanlar" Tasarımı**: 5 alternatiften sadece **Cam Küp 3D (Glass 3D)** bırakıldı. `TrendingWidget.js` içindeki ClassicTrending, NeonTrending, BannerTrending, FlameTrending variant fonksiyonları ve `renderCard` switch ifadesi kaldırıldı.
- **Ana Sayfa "Ana Slider" (Popüler Seriler) Tasarımı**: 5 alternatiften sadece **Kademeli Yükseliş (Cascading Steps)** bırakıldı. `HeroSliderWidget.js` içindeki ClassicHero, CinemaHero, HoloHero, CyberpunkHero variant fonksiyonları ve switch ifadesi kaldırıldı.
- **Seri Detay Sayfası Tasarımı**: 5 alternatiften sadece **Klasik Parallax (Mevcut Görünüm)** bırakıldı.
- **Yorum Bölümü Tasarımı**: 5 alternatiften sadece **Klasik (Asura Style)** bırakıldı. `CommentSection.js` içindeki kullanılmayan style2–style5 CSS blokları (~200 satır) kaldırıldı.
- **Admin Paneli**: Tüm 6 tasarım seçim dropdown'u, sadece kalan tek seçeneği gösterecek şekilde güncellendi; gereksiz seçenekler silindi.

---

## [v2.5.0] — 2026-06-14 (Elli Dokuzuncu Yayın)

### ✨ Yeni Özellikler

- **Okuyucu Destek Kartı (Reader Support Card)**: Bölüm okuma sayfasının en altına, son görselden sonra glassmorphism tasarımlı bir destek kartı eklendi. Koyu tema ile uyumlu, mor/lacivert tonlarda, yuvarlatılmış köşeli ve blur efektli kart; okuyucuları projeye destek olmaya davet eden bir metin ve "Destek Ol" butonu içeriyor. Webtoon, Manga ve Novel olmak üzere tüm okuma modlarında çalışıyor.
- **Admin Paneli — Destek Kartı Özelleştirmesi**: Admin panelinin "Genel Ayarlar" bölümüne "Okuyucu Destek Kartı" alt bölümü eklendi. Kartın açılıp kapatılması, görünen metnin düzenlenmesi, buton metni ve buton URL'si admin panelden yönetilebiliyor. Değişiklikler anlık olarak yansıyor.
- **Veritabanı Migrasyonu**: `app_settings` tablosuna `reader_support_enabled`, `reader_support_text`, `reader_support_url` ve `reader_support_button_text` anahtarları eklendi. Varsayılan değerler ile gelir; mevcut kurulumlar otomatik olarak güncellenir.

---

## [v2.4.9] — 2026-06-14 (Elli Sekizinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Yorum Şikayetleri — Kutu Görünümü → Liste Formatı**: Admin paneldeki yorum şikayetleri kare kutu (grid) şeklinde gösteriliyordu; karmaşık ve taraması zordu. Liste formatına dönüştürüldü; her rapor tek satırda, durum, içerik ve işlemler yan yana gösteriliyor.
- **Yorum Şikayetleri — Rapor Silme Eksikliği**: Şikayet kartlarında yalnızca "Çöz", "Reddet" ve "Yorumu Sil" butonları vardı; raporun kendisini silme seçeneği yoktu. Hem aktif hem çözülmüş/reddedilmiş raporlar için "Raporu Sil" butonu eklendi. `/api/reports/comments` endpoint'ine DELETE handler'ı eklendi.
- **Yorum Moderasyon — Toplu/tekli Seçim Çalışmıyor**: Yorum tablosundaki checkbox'lar hiç çalışmıyordu; state yönetimi ve olay işleyicisi yoktu. `selectedComments` state'i eklendi, header checkbox'ı "tümünü seç/bırak" işlevi yapıyor, satır checkbox'ları tekil seçim sağlıyor. Seçili yorumlar vurgulanıyor. Toplu silme butonu ile birden fazla yorum aynı anda silinebiliyor.
- **Layout.js — Sunucu Hatası Düzeltildi**: `lib/serverSettingsCache.js` modülü ile yapılan deneme, layout.js'in modül import yapısını bozuyordu ve 500 sunucu hatasına neden oluyordu. Bu modül kaldırıldı ve layout.js orijinal in-memory cache yapısına geri döndürüldü. Settings API normal şekilde çalışıyor.

---

## [v2.4.8] — 2026-06-14 (Elli Yedinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Manga Modu — Yorumlar Görünmüyor**: Manga modunda okuma yaparken yorum bölümü hiç render edilmiyordu. Webtoon ve Novel modlarında yorumlar gösterilirken Manga modunda eksikti. Manga moduna da CommentSection eklendi.
- **Manga Modu — Navigasyon Ters**: Manga modunda RTL (sağdan sola) yönde sol tıklama "sonraki" sayfaya, sağ tıklama "önceki" sayfaya götürüyordu; kullanıcının beklediği davranışın tam tersi. RTL modunda sol=önceki, sağ=sonraki olarak düzeltildi. LTR modu da buna uygun güncellendi.
- **Özel Roller — Admin Paneli Erişimi**: Oluşturulan özel roller, Navbar'daki yönetim paneli linkinde ve admin paneli erişim kontrolünde tanınmıyordu. Navbar ve admin paneli artık custom_roles ayarından dinamik olarak rol isimlerini çekip erişim kontrolünü buna göre yapıyor. Özel role sahip kullanıcılar hem Navbar'da Yönetim Paneli bağlantısını görüyor hem de panele erişebiliyor.
- **Kapak Resmi — Kaydet Sonrası Geri Dönme**: Profil sayfasında kapak resmi kaydedildikten sonra sayfa yeniden render olduğunda cover_url eski haline dönüyordu. saveCover fonksiyonu API yanıtından gelen yeni cover_url'yi updateUser ile hemen state'e yazacak şekilde güncellendi. Ayrıca API'den dönen cover URL'sine cache-breaker eklendi.
- **Kapak Resmi — Mobil Uyumluluk**: Profil sayfasındaki RPG profil başlığının cover görseli mobilde ekrana sığmıyordu. CSS'de `.rpg-profile-header` için `background-size: cover`, `background-position: center` ve mobil responsive düzenlemeler eklendi.
- **Favicon — Tarayıcıda Görünmüyor**: Favicon URL'lerine query string eklenmeden önce base URL oluşturuluyordu; bazı tarayıcılar URL formatını düzgün çözümleyemiyordu. URL yapısı düzeltildi: base URL önce oluşturuluyor, sonra cache-breaker `?v=` eki ekleniyor. Ayrıca ICO, GIF, SVG gibi formatlar için doğru MIME type belirleme eklendi.
- **Kullanıcı Profili — Kendi Profilimize Yönlendirme**: Yorumlardan bir kullanıcı profiline tıkladığımızda basit bir kullanıcı kartı gösteriliyordu. Artık kendi profilimize tıkladığımızda `/profile` sayfasına yönlendirme yapılıyor (kendi profilimizi tam detaylı görüyoruz).
- **Kütüphane — Bırakıldı Sekmesi Eksik**: Profil sayfasındaki Kütüphane sekmesinde "Okuyor", "Tamamlandı", "Okuyacak" sekmeleri vardı ama "Bırakıldı" (dropped) sekmesi yoktu. Yeni sekme eklendi; bırakılan seriler artık profil listesinde görüntüleniyor.

---

## [v2.4.7] — 2026-06-13 (Elli Altıncı Yayın)

### ⚡ Performans Optimizasyonları

- **Browser Cache Kırılması Düzeltildi** (`app/layout.js`): Favicon, logo ve icon URL'lerinde `Date.now()` kullanılıyordu. Bu her SSR isteğinde yeni bir URL üretip tarayıcının bu varlıkları hiç cache'lememesine yol açıyordu. `SERVER_START_VER` (sunucu başlangıcında bir kez üretilen base36 timestamp) ile değiştirildi. Artık tarayıcı ikonları cache'ler; yeni deployment'ta sunucu yeniden başladığında URL değişip cache bozulur.
- **Site Ayarları In-Memory Cache** (`app/layout.js`): `getSiteSettings()` her SSR isteğinde `app_settings` tablosunun tamamını okuyordu. 60 saniyelik TTL'li in-memory cache eklendi. 60 saniyede bir DB sorgusu yapılır, arada tüm istekler cache'ten karşılanır.
- **Paylaşılan Client Settings Cache** (`lib/settingsCache.js`): `SeriesDetailClient` ve `CommentSection` bileşenleri her mount'ta `/api/settings`'e ayrı ayrı istek atıyordu. Yeni `lib/settingsCache.js` modülü ile aynı sekme oturumunda tek bir fetch yapılır; sonuç tüm bileşenler arasında paylaşılır.
- **`/api/settings` Cache-Control** (`app/api/settings/route.js`): `no-store` yerine `public, max-age=30, stale-while-revalidate=60` kullanıldı. Tarayıcı 30 saniye boyunca ağ isteği yapmadan cache'ten okur.
- **Next.js Config Optimizasyonları** (`next.config.mjs`): Üretimde `removeConsole` eklendi (hata/uyarı logları korunur, gereksiz debug log'lar bundle'dan çıkar). `deviceSizes` ve `imageSizes` dizileri kullanılan breakpoint'lere göre sadeleştirildi. Public statik dosyalar (icon, font, görsel) için 7 günlük Cache-Control header eklendi.

### 🐛 Hata Kontrolü

- Son değişikliklerin tamamı (`a711517..`) gözden geçirildi; ek sorun tespit edilmedi.

---

## [v2.4.6] — 2026-06-13 (Elli Beşinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Yorum Şikayetleri — Admin Panelde Görünmüyor**: `app/api/reports/comments/route.js` dosyasında GET ve PUT handler'larında `getVerifiedUser(request)` çağrısı yapılıyordu. Bu fonksiyon ikinci parametre olarak `db` instance'ı gerektiriyor (`getVerifiedUser(request, db)`); eksik parametre nedeniyle fonksiyon içinde `db.prepare()` çağrısı `TypeError: Cannot read properties of undefined` hatası fırlatıyordu. Hata try/catch tarafından yakalanarak 500 döndürülüyordu; sonuç olarak admin paneli yorum şikayetlerini hiç yükleyemiyor ve durum güncellemesi yapamıyordu. Her iki handler'da da `db` parametresi eklenerek düzeltildi.

---

## [v2.4.5] — 2026-06-13 (Elli Dördüncü Yayın)

### 🐛 Hata Düzeltmeleri

- **SeriesCard — 18+ Rozet Konumu**: Yetişkin içerik rozetleri `.series-card-overlay` div'inin içinde `position: absolute` ile yanlış konumlanıyordu; overlay sağ üst köşede konumlandığından rozet kartın dışına taşıyordu. Rozet `.series-card-image` container'ına taşındı ve `z-index: 3` ile doğru pozisyon sağlandı.
- **SeriesCard — Bölüm Sayısı 0 Gösterimi**: `||` operatörü kullanımı nedeniyle bölüm sayısı gerçekten `0` olduğunda da fallback'e düşüp `0 bölüm` gösteriliyordu. `??` (nullish coalescing) operatörüne geçildi. Artık veri yoksa span hiç gösterilmiyor, bölüm sayısı 0 ise "Bölüm yok" yazıyor, pozitif sayıda ise `N bölüm` gösteriliyor.
- **Related Series — `is_adult` Eksikliği**: `app/series/[id]/page.js` ve `app/api/series/similar/route.js` dosyalarındaki ilgili seri SQL sorgularında `is_adult` kolonu seçilmiyordu. Bu nedenle "Bunları da Beğenebilirsiniz" bölümündeki yetişkin seriler için 18+ rozeti ve blur efekti hiç gösterilmiyordu. Her iki sorguya da `is_adult` alanı eklendi.

### 🔍 Kritik SEO Hatası Düzeltmesi

- **Bölüm Sayfaları noindex Hatası**: `app/seri/[id]/bolum/[chapterNumber]/layout.js` dosyasında `chapters` tablosuna yapılan sorgularda `AND published = 1` filtresi kullanılıyordu. Ancak bu tablo `published` kolonuna sahip değil — SQLite "no such column" hatası fırlatıyor, try/catch bunu yakalayıp `{ robots: { index: false } }` döndürüyordu. Sonuç olarak **tüm bölüm sayfaları noindex** oluyor ve Google tarafından indexlenmiyordu. `AND published = 1` filtresi her iki sorgudan kaldırıldı.

### 🔍 SEO İyileştirmeleri

- **Sitemap URL Tutarlılığı**: `app/sitemap.xml/route.js` dosyasında seri sayfaları için `/seri/[slug]` URL'leri kullanılıyordu. Canonical tag'ler ise `/series/[slug]` işaret ettiğinden sitemap ile canonical arasında duplicate content riski oluşuyordu. Sitemap'teki seri URL'leri `/series/[slug]` olarak güncellendi.
- **Robots.txt Wildcard Kuralları**: `app/robots.js` dosyasında yalnızca `/series/` ve `/seri/` prefix'leri allow listesindeydi; alt sayfalar için açık wildcard yoktu. `'/series/*'` ve `'/seri/*'` kuralları eklendi.
- **ComicSeries Schema Zenginleştirme**: `app/series/[id]/layout.js` dosyasındaki JSON-LD şemasına eksik alanlar eklendi: `inLanguage: "tr"` (dil bilgisi), `numberOfEpisodes` (DB'den canlı bölüm sayısı), `datePublished` (seri oluşturma tarihi), `dateModified` (son bölüm ekleme tarihi), `alternateName` (alt adlar varsa dizi olarak). Google Structured Data zenginliği arttı.
- **OG Description'a Alt Adlar**: Seri detay sayfasının Open Graph `description` alanına, seri alternatif adları (alt_names) varsa `Diğer adlar: ...` şeklinde ekleniyor. Arama sonuçlarında önizleme metni daha bilgilendirici hale geldi. Alt adlar aynı zamanda keywords listesine de eklendi.

---

## [v2.4.4] — 2026-06-13 (Elli Üçüncü Yayın)

### 🐛 Hata Düzeltmeleri

- **Yorum Şikayetleri — Admin Panel Görünmüyor**: Yorum şikayetleri admin paneldeki Yorumlar sekmesinde görünmüyordu. `app/api/reports/comments/route.js` ve `app/admin-panel/page.js` dosyalarına debug logları eklendi ve hata yakalama bloğu iyileştirildi.
- **Kullanıcı Profil Linki — Tıklanamıyor**: Yorumlarda kullanıcı adına tıklandığında profil sayfasına gidilemiyordu. `components/CommentSection.js` dosyasına `Link` import'u eklendi ve kullanıcı adı tıklanabilir hale getirildi.
- **Router Tanımlanmamış Hatası**: `CommentSection.js` bileşeninde `router.push('/login')` çağrısı yapılıyordu ama `useRouter` import edilmemişti. Hook import edildi ve bileşen içinde kullanıma hazır hale getirildi.

### ✨ Yeni Özellikler

- **Kullanıcı Profil Sayfası**: `/user/[username]` rotası eklendi. Bu sayfa herhangi bir kullanıcının profil bilgilerini (avatar, rol, puan, favori sayısı, yorum sayısı, katılım tarihi) herkesin görebilmesini sağlıyor.
- **Seri İstekleri — Admin Onayı Zorunlu**: Seri istekleri artık admin tarafından onaylanana kadar herkese görünmüyor. Yalnızca `reviewing`, `approved` ve `added` durumlarındaki istekler herkese açık. Bekleyen (`pending`) istekler sadece isteği gönderen kullanıcı ve adminler tarafından görülebilir.
- **Kullanıcı Kendi Taleplerini Görebilir**: `/requests` sayfasında giriş yapmış kullanıcılar artık kendi tüm taleplerini (bekleyen, onaylanan, reddedilen vb.) "Taleplerim" başlığı altında görebilirler.

---

## [v2.4.3] — 2026-06-13 (Elli İkinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Rol Yönetimi — Custom Rol Atanamıyordu**: Admin panelinde custom rol oluşturulduktan sonra kullanıcıya atama yapılıp onaylandığında rol atanmıyordu. `app/api/admin/route.js` dosyasında `change-user-role` action'ı yalnızca built-in rolleri destekliyordu. Artık custom rolleri de veritabanından okuyarak atama yapılabiliyor.
- **Kapak (Cover) Kırpma Sorunu**: Profil kapak görseli kırpılırken önizleme ile kaydedilen görsel arasında yön uyumsuzluğu vardı. `lib/imageOptimizer.js` dosyasındaki `optimizeProfileCover` fonksiyonunda `extractLeft` ve `extractTop` hesaplamalarındaki işaretler düzeltildi.
- **Favicon — Çift Tanım Sorunu**: `app/layout.js` dosyasında favicon hem `generateMetadata()` içinde hem de `<head>` bölümünde tanımlanıyordu. Bu çakışma bazı tarayıcılarda favicon'un görünmemesine neden olabilirdi. `<head>` içindeki favicon `<link>` etiketleri kaldırıldı; artık yalnızca `generateMetadata()` üzerinden yönetiliyor.
- **WebP Kalite Kaybı**: Seri sayfa görselleri zaten WebP formatında yüklendiğinde tekrar WebP'ye dönüştürülüyor ve bu kalite kaybına neden oluyordu. `lib/imageOptimizer.js` dosyasındaki `isWebPAlreadyOptimized` fonksiyonu ve `optimizeChapterPage` fonksiyonları güncellendi. Artık zaten WebP olan ve boyutları uygun görseller doğrudan kopyalanıyor, yeniden kodlanmıyor.

### ✨ Yeni Özellikler

- **Pop-up Bildirim — Cam Efekti Tasarımı**: `components/PopupAlert.js` tamamen yeniden tasarlandı. Glassmorphism (cam efekti) tasarımı eklendi: blur efektleri, shimmer çizgileri, gradient parlamalar, modern shadow efektleri ve yumuşak animasyonlar.
- **Pop-up — Gösterim Aralığı Ayari**: Pop-up artık her seferinde çıkmak yerine belirli aralıklarla gösterilebilir. Admin panelinde yeni "Gösterim Aralığı" seçeneği eklendi: "Her Zaman", "Günde Bir", "3 Saatte Bir", "Saatte Bir", "Oturum Başına Bir". `alert_popup_interval` ayarı `localStorage` ile takip ediliyor.
- **Pop-up — Admin Panelinde Gizleme**: Pop-up artık admin panelinde görünmüyor. `window.location.pathname` kontrolü ile `/admin-panel` sayfalarında pop-up otomatik olarak gizleniyor.
- **Yeni Bölüm Bildirimi**: Bir seriye yeni bölüm eklendiğinde artık favorilerine ekleyen veya okuma listesine ekleyen tüm kullanıcılara bildirim gönderiliyor. `app/api/admin/route.js` dosyasındaki `add-chapter` action'ına bildirim mantığı eklendi.
- **Yorum Yanıtı — Doğru Link**: Yorum yanıtı bildirimlerinde artık doğru link oluşturuluyor. Bölüm yorumları için `/seri/{slug}/bolum/{chapter}#comment-{id}` formatında, seri yorumları için `/seri/{seriesId}#comment-{id}` formatında link veriliyor.
- **Yorum Şikayet Bildirimi**: Bir yorum şikayet edildiğinde yorum sahibine bildirim gönderiliyor. Şikayet yönetici tarafından çözüldüğünde veya reddedildiğinde de raporu gönderen kullanıcıya bildirim gidiyor.
- **Bildirim İkonları**: Navbar'daki bildirim dropdown'unda artık farklı bildirim türleri için farklı ikonlar gösteriliyor: yorum yanıtı (mesaj), yeni bölüm (kitap+artı), şikayet (uyarı), şikayet çözüldü/reddedildi (uyarı+onay/red), hata raporları (kalkan).

---

## [v2.4.2] — 2026-06-13 (Elli Birinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Yorum Bildirimi — Token Eksikliği**: `handleReportSubmit` fonksiyonu düz `fetch` kullanıyordu; JWT token başlığı (`Authorization`) gönderilmediğinden `/api/reports/comments` her zaman 401 döndürüyor ve bildirim kaydedilmiyordu. `authFetch` ile değiştirildi. Aynı zamanda kullanıcının yazdığı ek detay (`reportDetails`) da API'ye iletilmiyordu, bu da düzeltildi.

---

## [v2.4.1] — 2026-06-13 (Ellinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Favicon — MIME Tipi Hatası**: `<link rel="icon">` etiketi daima `type="image/x-icon"` kullanıyordu. PNG olarak yüklenen favicon dosyaları bu yüzden bazı tarayıcılarda uygulanmıyordu. Artık dosya uzantısına göre doğru MIME tipi (`image/png`, `image/webp`, `image/svg+xml`, `image/x-icon`) atanıyor.
- **Favicon — Otomatik Kaydetme**: Admin panelinde favicon yüklemesi yapıldığında URL yalnızca yerel state'e yazılıyordu; kullanıcının ayrıca "Özelleştirmeyi Kaydet" butonuna basması gerekiyordu. Artık yükleme tamamlandığında URL `/api/admin/settings`'e otomatik olarak kaydediliyor. Logo ve OG görseli için de aynı iyileştirme geçerli.
- **Profil Resmi Limiti — Sayaç Sıfırlanma Hatası**: `refreshUser()` çağrısı `/api/auth/me` endpoint'ini tetikliyordu ve bu endpoint `avatar_changes_today` / `cover_changes_today` sütunlarını döndürmüyordu. Sonraki render'da bu alanlar `undefined` olduğundan `|| 1` fallback devreye giriyor ve her zaman "1 değişiklik hakkı kaldı" gösteriyordu. `/api/auth/me` SELECT sorgusuna eksik sütunlar eklendi.
- **Profil Resmi Limiti — Fallback Mantığı**: `canUpdateAvatar()` ve `canUpdateCover()` fonksiyonlarında `user.avatar_changes_today || 1` ifadesi, değer `0` (henüz kullanılmamış) olduğunda yanlışlıkla `1` döndürüyordu. `?? 0` (nullish coalescing) ile düzeltildi; `0` değeri artık doğru şekilde "henüz kullanılmadı" anlamına geliyor.

---

## [v2.4.0] — 2026-06-13 (Kırk Dokuzuncu Yayın)

### ✨ Yeni Özellikler

- **Özelleştirilebilir Uyarı Popup'ı**: Admin paneli → Reklamlar sekmesine yeni "Uyarı Popup'u" bölümü eklendi. Adblock uyarısı, ekip alımı, duyuru vb. için iki farklı tasarım tipi (Adblock tarzı / Özel) mevcuttur. Başlık, mesaj, ikon/emoji, arka plan rengi, "Geç" butonunun gecikmesi (X saniye, ayarlanabilir), bağlantı butonu (URL, etiket, yeni sekme), oturum başına bir kez gösterme seçeneği tamamen özelleştirilebilir. `components/PopupAlert.js` yeni client bileşeni oluşturuldu, `app/layout.js`'e eklendi.
- **Bölüm Sayfaları — Tekil Görsel Silme**: Admin panelinde bir bölümün sayfaları açıldığında artık her görselin üzerine gelindiğinde kırmızı çöp kutusu butonu görünüyor. Tek tek sayfa silinebilir, bölümün tamamını silmek gerekmez. `deleteChapterPage()` fonksiyonu eklendi, mevcut `delete-page` API action'ı kullanılıyor.

### 🐛 Hata Düzeltmeleri

- **Yorum Şikayetleri — Hata Bildirimleri Karışıklığı**: Kullanıcılar bir yorumu şikayet ettiğinde rapor, admin panelinin "Hata Bildirimleri" sekmesinde görünüyordu. `/api/admin/reports` GET endpoint'i artık `type = 'comment_report'` kayıtlarını hariç tutuyor; yorum şikayetleri yalnızca "Yorumlar" sekmesindeki "Yorum Şikayetleri" bölümünde listeleniyor.
- **Yorum Şikayetleri — Yorumu Sil Aksiyonu**: Yorum şikayet kartlarına "Yorumu Sil" butonu eklendi. Şikayet edilen yorumu doğrudan şikayet kartından silebilir, ardından rapor otomatik olarak "Çözüldü" durumuna geçer.

---

## [v2.3.0] — 2026-06-12 (Kırk Sekizinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Slider Cam Küp (Glass3D) — Alt Siyah Boşluk**: `trend_style4` (Cam Küp 3D) kartında görsel container'ına uygulanan `position: relative` inline style CSS class'ını (`.tg-bg { position: absolute }`) eziyordu, bu da görüntünün konteyneri tam kaplayamamasına ve alt kısımda `background: #111` olan siyah boşluğun görünmesine neden oluyordu. İnline style kaldırıldı.
- **Son Güncellemeler Renk Ayarları**: Admin panelinden yapılan başlık rengi, kart arka plan ve kenarlık rengi değişiklikleri artık tüm kart tiplerini kapsıyor. Önceden yalnızca `holo-card` ve `asura-card` CSS sınıfları hedefleniyordu; şimdi `glass-card`, `cosmic-card`, `cinematic-card` ve `skill-tree-card` sınıfları da dahil edildi.
- **Bakım Modu — SPA Navigasyon Sorunu**: Next.js client-side navigasyonu sırasında (Link tıklama) bakım modu kontrolü yapılmıyordu, F5 basılmadıkça kullanıcı sitede gezinebiliyordu. Yeni `MaintenanceChecker` client bileşeni eklendi; her route değişiminde `/api/maintenance-status` endpoint'ini kontrol ediyor ve bakım modu aktifse kullanıcıyı `/maintenance` sayfasına yönlendiriyor.

### ✨ İyileştirmeler

- **Yorum Şikayetleri — Admin Paneli**: Yorum şikayetleri artık admin panelindeki "Yorumlar" sekmesinde görünüyor. Şikayetler durumlarına göre (Beklemede / Çözüldü / Reddedildi) renklendirilmiş; tek tıkla durumu güncellenebilir. Yenile butonu ile anlık senkronizasyon sağlandı.
- **Özel Roller — Kullanıcı İşlemlerinde Görüntüleme**: Admin paneli kullanıcı tablosunda rol badge'i artık özel roller için de doğru etiketi ve rengi gösteriyor. Sabit `'Kullanıcı'` fallback yerine `customRoles` dizisinden dinamik lookup yapılıyor.
- **Özel Roller — Aktivite Paneli Rol Etiketi**: Kullanıcı aktivite panelinde görünen rol adı da hardcoded map yerine `customRoles`'dan besleniyor; özel rol atamaları doğru şekilde yansıtılıyor.
- **Custom Body JS**: Admin panelinin "Gelişmiş Ayarlar" bölümüne yeni "Body JS" alanı eklendi. Analytics, chat widget veya özel JavaScript kodları `<body>` sonuna enjekte edilebiliyor. CSS alanından ayrı tutularak daha net bir yapı sağlandı.
- **Serileri Keşfet Kartları**: Seri kartları daha modern görünüm kazandı. Hover animasyonunda üst parlama çizgisi ve alt gradient efekti eklendi. Kart body'si derinleştirilmiş gradient arka plana sahip oldu, hover'da daha koyu ton geçişi uygulandı.
- **Günlük Görevler Scroll Bar**: Görev listesi maksimum yüksekliği 480px'den 360px'e indirildi, smooth scroll eklendi; görev sayısı fazla olduğunda liste daha kompakt görünüyor.
- **Yorum Raporlama**: Mevcut rate limit sistemi (60 saniye, 10 rapor) korundu; aynı yorumu 1 saat içinde tekrar raporlama engeli de aktif.

---

## [v2.2.9] — 2026-06-12 (Kırk Yedinci Yayın)

### 🐛 Hata Düzeltmeleri

- **Favicon Geçersiz Kılma Sorunu**: Next.js, `app/favicon.ico` dosyasını metadata API'den bağımsız olarak otomatik servis ediyor ve özel favicon ayarını ezmesine neden oluyordu. `app/favicon.ico` dosyası kaldırıldı; artık yalnızca admin panelinden yüklenen favicon kullanılıyor.
- **Yorum Raporlama API**: Yorum raporları için ayrı bir API endpoint'i (`/api/reports/comments`) eklendi. Raporlar `bug_reports` tablosunda `type='comment'` olarak saklanıyor.
- **Admin Rapor Tablosu — Tür Kolonu**: Admin panelindeki rapor tablosuna "Tür" kolonu eklendi. Yorum raporları pembe badge ile, genel hata raporları mor badge ile gösteriliyor.
- **DB Migrasyonu**: `bug_reports` tablosuna `type` (TEXT, varsayılan `'bug'`) ve `comment_id` (INTEGER, varsayılan NULL) sütunları eklendi.

### ✨ İyileştirmeler

- **Son Güncellemeler — CSS Değişkenleri**: Kart stilleri (`asura-card`, `glass-card`) artık CSS değişkenleri (`--latest-updates-card-bg`, `--latest-updates-card-border`, `--latest-updates-hover-bg`, `--latest-updates-title-color`) kullanıyor. Tema renkleri admin panelinden dinamik olarak uygulanabiliyor.
- **Rozet Sistemi — Çevirmen Rolü**: Admin paneli rol değiştirme dropdown'una "Çevirmen" (`translator`) rolü eklendi.

---

## [v2.2.8] — 2026-06-12 (Kırk Altıncı Yayın)

### 🐛 Hata Düzeltmeleri

- **Holo Slider (Cam Küp) — Alt Siyah Boşluk**: `hero_style3` hologram slider'da görselin altında kalan ufak siyah boşluk giderildi. `.hs-holo-section` ve `.hs-holo-track` yükseklikleri düzeltildi.
- **WebP Görsel Kalitesi**: Zaten WebP formatında olan ve boyutları uygun görseller artık yeniden sıkıştırılmıyor. Bu özellikle seri kapakları ve profil görselleri yüklenirken kalite kaybını önlüyor. Tüm optimize fonksiyonlarına (`optimizeCoverImage`, `optimizeChapterPage`, `optimizeAvatar`, `optimizeProfileCover`) WebP kontrolü eklendi. Kalite ayarı 85'ten 90'a yükseltildi.
- **Yorum Raporlama Cooldown**: Yorum raporlama sistemine 60 saniye bekleme süresi eklendi. Aynı yorumu spam şekilde raporlamak artık engelleniyor.

### ✨ İyileştirmeler

- **SeriesCard Puanlama Modernizasyonu**: Puan göstergesi yeniden tasarlandı. Renk kodlu badge sistemi eklendi (4.0+ yeşil, 3.0-3.9 sarı, 2.0-2.9 turuncu, <2.0 kırmızı). Blur backdrop efektli modern badge görünümü eklendi.
- **Profil Sayfası — Tab Birleştirme**: Profil sayfasındaki tab yapısı sadeleştirildi. "Ayarlar" ve "Güvenlik" sekmeleri tek "Ayarlar" sekmesinde birleştirildi. "Kütüphane" ve "Okuma Listesi" sekmeleri tek "Kütüphane" sekmesinde alt-tab'lı olarak birleştirildi. Artık 5 sekme var: Genel Bakış, Kütüphane, İstatistikler, Rozetler, Ayarlar.
- **Günlük Görevler Scroll Bar**: Günlük görevler listesi artık scroll edilebilir. Maksimum yükseklik 480px olarak ayarlandı. Özel scrollbar stili eklendi.
- **Bakım Modu — Client-Side Kontrol**: Bakım modu artık sadece F5'te değil, client-side navigasyonlarda da kontrol ediliyor. SettingsProvider her 30 saniyede bir bakım modu durumunu kontrol ediyor ve aktifse kullanıcıyı bakım sayfasına yönlendiriyor.

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