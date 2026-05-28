'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

function SliderNav({ popularSeries, prevSlide, nextSlide, slideIndex, goToSlide }) {
  if (popularSeries.length <= 1) return null;
  return (
    <>
      <button className="hs-nav-btn prev" onClick={prevSlide} aria-label="Önceki">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button className="hs-nav-btn next" onClick={nextSlide} aria-label="Sonraki">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
      <div className="hs-dots">
        {popularSeries.map((_, idx) => (
          <button
            key={idx}
            className={`hs-dot${slideIndex === idx ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
            aria-label={`Seri ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
}

// 1. KLASİK DECK
function ClassicHero({ popularSeries, slideIndex, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  return (
    <div className="hs-classic-section">
      <div className="hs-classic-bg-blur" style={{ backgroundImage: `url(${activeSeries.cover_url || '/demo/cover1.jpg'})` }} />
      <div className="hs-classic-viewport">
        <div className="hs-classic-track">
          {popularSeries.map((s, idx) => {
            const offset = ((idx - slideIndex + popularSeries.length) % popularSeries.length);
            const deckClass = idx === slideIndex ? ' active' : offset === 1 ? ' next' : offset === popularSeries.length - 1 ? ' prev' : ' hidden';
            return (
              <Link key={s.id} href={`/series/${s.slug || s.id}`} className={`hsc-slide${deckClass}`}>
                <img className="hsc-cover" src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} />
                <div className="hsc-overlay">
                  <div className="hsc-title">{s.title}</div>
                </div>
                <div className="hsc-rating">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {s.rating?.toFixed(1) || '0.0'}
                </div>
              </Link>
            );
          })}
        </div>
        <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
      </div>
    </div>
  );
}

// 2. SİNEMATİK GENİŞ EKRAN
function CinemaHero({ popularSeries, slideIndex, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  return (
    <div className="hs-cinema-section">
      <div className="hs-cinema-bg" style={{ backgroundImage: `url(${activeSeries.cover_url || '/demo/cover1.jpg'})` }} />
      <div className="hs-cinema-gradient" />
      <div className="hs-cinema-content">
        <div className="hscin-cover-wrap">
          <img src={activeSeries.cover_url || '/demo/cover1.jpg'} alt={activeSeries.title} />
        </div>
        <div className="hscin-info">
          <div className="hscin-title">{activeSeries.title}</div>
          <div className="hscin-meta">
            <span className="hscin-rating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {activeSeries.rating?.toFixed(1) || 'N/A'}
            </span>
            <span>•</span>
            <span>{activeSeries.chapter_count || 0} Bölüm</span>
          </div>
          <div className="hscin-genres">
            {parseGenres(activeSeries.genres).slice(0, 4).map(g => (
              <span key={g} className="hscin-genre">{GENRE_TR[g] || g}</span>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {activeSeries.summary || 'Bu heyecan verici serinin yeni bölümlerini kaçırmayın. Hemen okumaya başlayın.'}
          </div>
          <Link href={`/series/${activeSeries.slug || activeSeries.id}`} className="hscin-btn">
            Hemen Oku
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
      </div>
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// 3. HOLOGRAFİK AKIŞ (Holo Cover Flow)
function HoloHero({ popularSeries, slideIndex, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  return (
    <div className="hs-holo-section">
      <div className="hs-holo-track">
        {popularSeries.map((s, idx) => {
          const offset = ((idx - slideIndex + popularSeries.length) % popularSeries.length);
          let deckClass = ' hidden';
          if (idx === slideIndex) deckClass = ' active';
          else if (offset === 1) deckClass = ' next1';
          else if (offset === 2 && popularSeries.length > 4) deckClass = ' next2';
          else if (offset === popularSeries.length - 1) deckClass = ' prev1';
          else if (offset === popularSeries.length - 2 && popularSeries.length > 4) deckClass = ' prev2';

          return (
            <Link key={s.id} href={`/series/${s.slug || s.id}`} className={`hsh-slide${deckClass}`}>
              <img className="hsh-cover" src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} />
            </Link>
          );
        })}
      </div>
      <div className="hsh-info-bar">
        <div className="hsh-title">{activeSeries.title}</div>
      </div>
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// 4. KADEMELİ YÜKSELİŞ (Cascading Steps)
function CascadeHero({ popularSeries, slideIndex, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  const len = popularSeries.length;
  if (len === 0) return null;
  const s1 = popularSeries[(slideIndex + 1) % len];
  const s2 = popularSeries[(slideIndex + 2) % len];
  const s3 = popularSeries[(slideIndex + 3) % len];

  return (
    <div className="hs-cascade-section">
      <div className="hs-cascade-bg" style={{ backgroundImage: `url(${activeSeries.cover_url || '/demo/cover1.jpg'})` }} />
      <div className="hs-cascade-active-area">
        <img key={`c1-${activeSeries.id}`} className="hscas-cover" src={activeSeries.cover_url || '/demo/cover1.jpg'} alt={activeSeries.title} />
        <div key={`c2-${activeSeries.id}`} className="hscas-info">
          <div style={{ color: 'var(--accent)', fontWeight: 800, marginBottom: 8, fontSize: '0.8rem', letterSpacing: 1 }}>HAFTANIN POPÜLERİ</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 12 }}>{activeSeries.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {activeSeries.summary || 'Bu heyecan verici serinin yeni bölümlerini kaçırmayın. Hemen okumaya başlayın.'}
          </div>
          <Link href={`/series/${activeSeries.slug || activeSeries.id}`} style={{ display: 'inline-block', background: '#fff', color: '#000', padding: '10px 24px', borderRadius: '30px', fontWeight: 800, textDecoration: 'none' }}>
            OKUMAYA BAŞLA
          </Link>
        </div>
      </div>
      {len > 1 && (
        <div className="hs-cascade-steps">
          {len > 1 && s1 && <Link href={`/series/${s1.slug || s1.id}`} className="hscas-step-card hscas-step-1"><img src={s1.cover_url} alt="" /></Link>}
          {len > 2 && s2 && <Link href={`/series/${s2.slug || s2.id}`} className="hscas-step-card hscas-step-2"><img src={s2.cover_url} alt="" /></Link>}
          {len > 3 && s3 && <Link href={`/series/${s3.slug || s3.id}`} className="hscas-step-card hscas-step-3"><img src={s3.cover_url} alt="" /></Link>}
        </div>
      )}
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// 5. SİBERPUNK VİTRİN (Cyberpunk Neon)
function CyberpunkHero({ popularSeries, slideIndex, ...navProps }) {
  return (
    <div className="hs-cyber-section">
      <div className="hs-cyber-track">
        {popularSeries.map((s, idx) => {
          const offset = ((idx - slideIndex + popularSeries.length) % popularSeries.length);
          const deckClass = idx === slideIndex ? ' active' : offset === 1 ? ' next' : offset === popularSeries.length - 1 ? ' prev' : ' hidden';
          return (
            <Link key={s.id} href={`/series/${s.slug || s.id}`} className={`hscy-slide${deckClass}`}>
              <div className="hscy-inner">
                <img src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} />
              </div>
              {idx === slideIndex && <div className="hscy-glitch-text">{s.title}</div>}
            </Link>
          );
        })}
      </div>
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

export default function HeroSliderWidget({ design, popularSeries }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoplayRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const startAutoplay = useCallback((totalLen) => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % totalLen);
    }, 4500);
  }, []);

  useEffect(() => {
    if (!popularSeries || popularSeries.length <= 1) return;
    startAutoplay(popularSeries.length);
    return () => clearInterval(autoplayRef.current);
  }, [popularSeries.length, startAutoplay]);

  const prevSlide = (e) => {
    if(e) e.stopPropagation();
    const len = popularSeries.length;
    if (len <= 1) return;
    setSlideIndex(prev => (prev - 1 + len) % len);
    startAutoplay(len);
  };

  const nextSlide = (e) => {
    if(e) e.stopPropagation();
    const len = popularSeries.length;
    if (len <= 1) return;
    setSlideIndex(prev => (prev + 1) % len);
    startAutoplay(len);
  };

  const goToSlide = (idx) => {
    const len = popularSeries.length;
    setSlideIndex(idx);
    startAutoplay(len);
  };

  const handleTouchStart = (e) => { setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    const len = popularSeries.length;
    if (len <= 1) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  if (!popularSeries || popularSeries.length === 0) return null;

  return (
    <div className="hero-slider-wrapper" ref={sliderRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {(() => {
        switch (design) {
          case 'hero_style2': return <CinemaHero popularSeries={popularSeries} slideIndex={slideIndex} prevSlide={prevSlide} nextSlide={nextSlide} goToSlide={goToSlide} />;
          case 'hero_style3': return <HoloHero popularSeries={popularSeries} slideIndex={slideIndex} prevSlide={prevSlide} nextSlide={nextSlide} goToSlide={goToSlide} />;
          case 'hero_style4': return <CascadeHero popularSeries={popularSeries} slideIndex={slideIndex} prevSlide={prevSlide} nextSlide={nextSlide} goToSlide={goToSlide} />;
          case 'hero_style5': return <CyberpunkHero popularSeries={popularSeries} slideIndex={slideIndex} prevSlide={prevSlide} nextSlide={nextSlide} goToSlide={goToSlide} />;
          case 'hero_style1':
          default:
            return <ClassicHero popularSeries={popularSeries} slideIndex={slideIndex} prevSlide={prevSlide} nextSlide={nextSlide} goToSlide={goToSlide} />;
        }
      })()}
    </div>
  );
}
