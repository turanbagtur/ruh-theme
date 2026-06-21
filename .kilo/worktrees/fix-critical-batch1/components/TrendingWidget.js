'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

const GENRE_TR = {
  'Action': 'Aksiyon', 'Adventure': 'Macera', 'Comedy': 'Komedi', 'Drama': 'Drama',
  'Fantasy': 'Fantastik', 'Historical': 'Tarihi', 'Horror': 'Korku', 'Isekai': 'Isekai',
  'Martial Arts': 'Dövüş', 'Mystery': 'Gizem', 'Reincarnation': 'Reenkarnasyon',
  'Romance': 'Romantik', 'School': 'Okul', 'Sci-Fi': 'Bilim Kurgu',
  'Supernatural': 'Doğaüstü', 'Thriller': 'Gerilim', 'Ecchi': 'Ecchi', 'Harem': 'Harem',
  'Josei': 'Josei', 'Mature': 'Yetişkin', 'Mecha': 'Mecha', 'Psychological': 'Psikolojik',
  'Seinen': 'Seinen', 'Shoujo': 'Shoujo', 'Shounen': 'Shounen', 'Slice of Life': 'Günlük',
  'Sports': 'Spor', 'Tragedy': 'Trajedi', 'Webtoon': 'Webtoon', 'Manhwa': 'Manhwa', 'Manhua': 'Manhua'
};

function parseGenres(genresStr) {
  if (!genresStr) return [];
  try {
    const arr = JSON.parse(genresStr);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    if (typeof genresStr === 'string') return genresStr.split(',').map(s => s.trim());
    return [];
  }
}

const getStatusTr = (status) => {
  if (status === 'completed') return 'Tamamlandı';
  if (status === 'hiatus') return 'Ara Verildi';
  if (status === 'cancelled') return 'İptal Edildi';
  return 'Devam Ediyor';
};

// 1. Klasik (Mevcut Görünüm)
export function ClassicTrending({ series, index, isBlocked, href, user }) {
  return (
    <Link href={href || `/series/${series.slug || series.id}`} className="trending-card group" style={{ position: 'relative' }}>
      <div className="tc-cover" style={{ position: 'relative', overflow: 'hidden' }}>
        <span className={`tc-number rank-${index + 1}`}>{index + 1}</span>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" style={isBlocked ? { filter: 'blur(10px)', transform: 'scale(1.1)' } : {}} />
        <div className="tc-overlay" />
        <AdultCardOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="tc-info">
        <span className="tc-title">{series.title}</span>
        <span className="tc-genres">
          {parseGenres(series.genres).slice(0, 2).map(g => GENRE_TR[g] || g).join(', ')}
        </span>
      </div>
    </Link>
  );
}

// 2. Neon Yansıma (Neon Glow)
export function NeonTrending({ series, index, isBlocked, href, user }) {
  return (
    <Link href={href || `/series/${series.slug || series.id}`} className="trend-neon-card" style={{ position: 'relative' }}>
      <div className="tn-cover" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="tn-rank">{index + 1}</div>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" style={isBlocked ? { filter: 'blur(10px)', transform: 'scale(1.1)' } : {}} />
        <AdultCardOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="tn-info">
        <div className="tn-title">{series.title}</div>
      </div>
    </Link>
  );
}

// 3. Geniş Pankart (Horizontal Banners)
export function BannerTrending({ series, index, isBlocked, href, user }) {
  return (
    <Link href={href || `/series/${series.slug || series.id}`} className="trend-banner-card" style={{ position: 'relative' }}>
      <div className="tb-cover" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" style={isBlocked ? { filter: 'blur(10px)', transform: 'scale(1.1)' } : {}} />
        <div className="tb-rank">#{index + 1}</div>
        <AdultCardOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="tb-info">
        <div className="tb-title">{isBlocked ? '18+ İçerik' : series.title}</div>
        {!isBlocked && (
          <>
            <div className="tb-meta">
              <span className="tb-meta-rating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                {series.rating ? series.rating.toFixed(1) : 'N/A'}
              </span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{getStatusTr(series.status)}</span>
            </div>
            <div className="tb-genres">
              {parseGenres(series.genres).slice(0, 3).map(g => GENRE_TR[g] || g).join(', ')}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

// 4. Cam Küp 3D (Glass 3D)
export function Glass3DTrending({ series, index, isBlocked, href, user }) {
  return (
    <div className="trend-glass3d-container">
      <Link href={href || `/series/${series.slug || series.id}`} className="trend-glass3d-card" style={{ display: 'block', position: 'relative' }}>
        <div className="tg-bg" style={{ position: 'relative', overflow: 'hidden' }}>
          <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" style={isBlocked ? { filter: 'blur(10px)', transform: 'scale(1.1)' } : {}} />
        </div>
        <div className="tg-overlay">
          <div className="tg-title">{isBlocked ? '🔞 18+' : series.title}</div>
        </div>
        <div className="tg-rank">#{index + 1}</div>
        <AdultCardOverlay isAdult={series.is_adult} user={user} />
      </Link>
    </div>
  );
}

// 5. Alevli Yükseliş (Flaming Rise)
export function FlameTrending({ series, index, isBlocked, href, user }) {
  return (
    <Link href={href || `/series/${series.slug || series.id}`} className="trend-flame-card" style={{ position: 'relative' }}>
      <div className="tf-cover-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="tf-cover">
          <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" style={isBlocked ? { filter: 'blur(10px)', transform: 'scale(1.1)' } : {}} />
        </div>
        <div className="tf-rank">#{index + 1}</div>
        <AdultCardOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="tf-info">
        <div className="tf-title">{isBlocked ? '18+ İçerik' : series.title}</div>
      </div>
    </Link>
  );
}

// Trend kartları için yetişkin içerik overlay bileşeni
function AdultCardOverlay({ isAdult, user }) {
  if (!isAdult || user) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)', borderRadius: 'inherit',
      color: '#fff', pointerEvents: 'none',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.04em' }}>18+</span>
    </div>
  );
}

function renderCard(design, series, idx, user, rawKey) {
  // rawKey: tripleList'te benzersiz key için ham liste indeksi
  // idx: gösterim için rank numarası (modded)
  const key = rawKey !== undefined ? `${series.id}-raw-${rawKey}` : `${series.id}-${idx}`;
  const isBlocked = series.is_adult && !user;
  const href = isBlocked ? '/login' : `/series/${series.slug || series.id}`;
  switch (design) {
    case 'trend_style2': return <NeonTrending key={key} series={series} index={idx} isBlocked={isBlocked} href={href} user={user} />;
    case 'trend_style3': return <BannerTrending key={key} series={series} index={idx} isBlocked={isBlocked} href={href} user={user} />;
    case 'trend_style4': return <Glass3DTrending key={key} series={series} index={idx} isBlocked={isBlocked} href={href} user={user} />;
    case 'trend_style5': return <FlameTrending key={key} series={series} index={idx} isBlocked={isBlocked} href={href} user={user} />;
    case 'trend_style1':
    default: return <ClassicTrending key={key} series={series} index={idx} isBlocked={isBlocked} href={href} user={user} />;
  }
}

export default function TrendingWidget({ design, trending, autoScrollEnabled = true }) {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const pausedRef = useRef(false);
  const posRef = useRef(0); // gerçek scroll pozisyonunu takip eder (senkronizasyon için)
  const SPEED = 0.55; // piksel/frame — yavaş ve akıcı
  const [autoScroll, setAutoScroll] = useState(autoScrollEnabled);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile state
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 3 kat kopyalama: sonsuz döngü için daha güvenli tampon
  const tripleList = trending.length > 0 ? [...trending, ...trending, ...trending] : [];

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !autoScroll || trending.length === 0) return;

    // İlk çalıştırmada mevcut scrollLeft'i al
    posRef.current = el.scrollLeft || 0;

    function step() {
      if (!pausedRef.current && el) {
        posRef.current += SPEED;
        // Üçlü listenin 1/3'üne ulaşınca ortadaki kopyaya atla (görsel sıçrama olmaz)
        const oneThird = el.scrollWidth / 3;
        if (posRef.current >= oneThird * 2) {
          posRef.current = oneThird;
        }
        // scrollLeft küçükse (kullanıcı elle geriye sürükledi) düzelt
        if (posRef.current < 1) {
          posRef.current = oneThird;
        }
        el.scrollLeft = posRef.current;
      }
      animFrameRef.current = requestAnimationFrame(step);
    }

    // Başlamadan önce kısa bir gecikme — DOM tamamen render olana kadar bekle
    const timer = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(step);
    }, 120);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoScroll, trending.length]);

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => {
    // Pozisyonu gerçek scrollLeft'ten senkronize et
    if (containerRef.current) posRef.current = containerRef.current.scrollLeft;
    pausedRef.current = false;
  };
  const handleTouchStart = () => { pausedRef.current = true; };
  const handleTouchEnd = () => {
    // Dokunuş bırakıldığında pozisyonu senkronize et, sonra devam et
    if (containerRef.current) posRef.current = containerRef.current.scrollLeft;
    // 1500ms sonra otomatik kaydırma devam etmeden once pozisyonu tekrar senkronize et
    // (kullanıcı bu sürede manuel olarak kaydırmıs olabilir)
    setTimeout(() => {
      if (containerRef.current) posRef.current = containerRef.current.scrollLeft;
      pausedRef.current = false;
    }, 1500);
  };

  // Mobilde de triple list kullan (seamless loop için), ancak otomatik kaydırma kapalıysa orijinal listeyi göster
  const displayList = autoScroll ? tripleList : trending;

  return (
    <div>
      {/* Otomatik Kaydırma Açma/Kapama Butonu */}
      <div className="trend-autoscroll-row">
        <button
          className={`trend-autoscroll-btn${autoScroll ? ' active' : ''}`}
          onClick={() => {
            setAutoScroll(v => !v);
            if (containerRef.current) posRef.current = containerRef.current.scrollLeft;
          }}
          title={autoScroll ? 'Otomatik kaydırmayı durdur' : 'Otomatik kaydırmayı başlat'}
        >
          {autoScroll ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <span className="trend-autoscroll-label">Otomatik Kaydırma Açık</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span className="trend-autoscroll-label">Otomatik Kaydırma Kapalı</span>
            </>
          )}
        </button>
      </div>

      <div
        ref={containerRef}
        className="trend-list-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={autoScroll && !isMobile ? {
          overflow: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          userSelect: 'none',
        } : {}}
      >
        {displayList.map((s, idx) => {
          const displayIdx = idx % (trending.length || 1);
          // rawIdx'i key için kullan — duplicate key uyarısını önler
          return renderCard(design, s, displayIdx, user, idx);
        })}
      </div>
    </div>
  );
}