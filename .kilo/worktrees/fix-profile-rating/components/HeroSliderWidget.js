'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
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

// 1. KLASİK HERO (Yeniden Tasarım — Asura/MangaDex stili geniş ekran)
// 1. KLASİK HERO — Kart Destesi Tasarımı (Classic Card Deck Style)
function ClassicHero({ popularSeries, slideIndex, user, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  const isAdultBlur = activeSeries.is_adult && !user;
  const chapterCount = activeSeries.chapterCount ?? activeSeries.chapter_count ?? 0;
  const genres = parseGenres(activeSeries.genres).slice(0, 3);
  const seriesType = activeSeries.type ? activeSeries.type.charAt(0).toUpperCase() + activeSeries.type.slice(1) : null;

  // Neighboring covers for deck effect
  const prevIdx = (slideIndex - 1 + popularSeries.length) % popularSeries.length;
  const nextIdx = (slideIndex + 1) % popularSeries.length;
  const prevSeries = popularSeries[prevIdx] || {};
  const nextSeries = popularSeries[nextIdx] || {};

  return (
    <div className="hs-deck-section">
      {/* Accent top bar */}
      <div className="hs-deck-accent-bar" />

      <div className="hs-deck-body">
        {/* Sol: Bilgi paneli */}
        <div key={`deck-info-${activeSeries.id}`} className="hs-deck-info">
          <div className="hs-deck-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ÖNERILEN
          </div>

          {seriesType && <span className="hs-deck-type">{seriesType}</span>}
          <h2 className="hs-deck-title">{activeSeries.title}</h2>

          <div className="hs-deck-stats">
            {activeSeries.rating > 0 && (
              <div className="hs-deck-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>{activeSeries.rating.toFixed(1)}</span>
              </div>
            )}
            {chapterCount > 0 && (
              <div className="hs-deck-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>{chapterCount} Bölüm</span>
              </div>
            )}
            <div className="hs-deck-status" data-status={activeSeries.status}>
              {activeSeries.status === 'ongoing' ? 'Devam Ediyor' :
               activeSeries.status === 'completed' ? 'Tamamlandı' :
               activeSeries.status === 'hiatus' ? 'Ara Verildi' :
               activeSeries.status || ''}
            </div>
          </div>

          {genres.length > 0 && (
            <div className="hs-deck-genres">
              {genres.map(g => <span key={g} className="hs-deck-genre">{GENRE_TR[g] || g}</span>)}
            </div>
          )}

          <p className="hs-deck-summary">
            {activeSeries.summary || 'Bu heyecan verici serinin yeni bölümlerini kaçırmayın. Hemen okumaya başlayın.'}
          </p>

          <div className="hs-deck-actions">
            <Link
              href={isAdultBlur ? '/login' : `/series/${activeSeries.slug || activeSeries.id}`}
              className="hs-deck-btn-primary"
            >
              {isAdultBlur ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 18+ Giriş</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Hemen Oku</>
              )}
            </Link>
            {!isAdultBlur && (
              <Link href={`/series/${activeSeries.slug || activeSeries.id}`} className="hs-deck-btn-ghost">
                Detaylar
              </Link>
            )}
          </div>

          {/* Dots */}
          <div className="hs-deck-dots">
            {popularSeries.map((_, idx) => (
              <button
                key={idx}
                className={`hs-deck-dot${slideIndex === idx ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); navProps.goToSlide(idx); }}
                aria-label={`Seri ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Sağ: Kart Destesi */}
        <div className="hs-deck-cards">
          {/* Arka kart 2 */}
          {popularSeries.length > 2 && (
            <div className="hs-deck-card hs-deck-card-back2">
              <img src={prevSeries.cover_url || ''} alt="" loading="lazy" />
            </div>
          )}
          {/* Arka kart 1 */}
          {popularSeries.length > 1 && (
            <div className="hs-deck-card hs-deck-card-back1">
              <img src={nextSeries.cover_url || ''} alt="" loading="lazy" />
            </div>
          )}
          {/* Öne kapak */}
          <div className="hs-deck-card hs-deck-card-front">
            <Link href={isAdultBlur ? '/login' : `/series/${activeSeries.slug || activeSeries.id}`}>
              <img
                key={`deck-cover-${activeSeries.id}`}
                src={activeSeries.cover_url || ''}
                alt={activeSeries.title}
                style={isAdultBlur ? { filter: 'blur(14px)', transform: 'scale(1.08)' } : {}}
              />
            </Link>
            {activeSeries.rating > 0 && !isAdultBlur && (
              <div className="hs-deck-card-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {activeSeries.rating.toFixed(1)}
              </div>
            )}
            <AdultOverlay isAdult={activeSeries.is_adult} user={user} />
          </div>

          {/* Nav butonlar */}
          <button className="hs-deck-nav prev" onClick={navProps.prevSlide} aria-label="Önceki">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="hs-deck-nav next" onClick={navProps.nextSlide} aria-label="Sonraki">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Alt seri şeridi */}
      {popularSeries.length > 1 && (
        <div className="hs-deck-strip">
          {popularSeries.slice(0, 8).map((s, idx) => (
            <button
              key={s.id}
              className={`hs-deck-strip-item${slideIndex === idx ? ' active' : ''}`}
              onClick={e => { e.stopPropagation(); navProps.goToSlide(idx); }}
              title={s.title}
            >
              <img src={s.cover_url || ''} alt={s.title} loading="lazy" />
              <div className="hs-deck-strip-label">{s.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. SİNEMATİK GENİŞ EKRAN
function CinemaHero({ popularSeries, slideIndex, user, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  const isAdultBlur = activeSeries.is_adult && !user;
  // API 'chapterCount' döndürür (camelCase), fallback olarak chapter_count da kontrol et
  const chapterCount = activeSeries.chapterCount ?? activeSeries.chapter_count ?? 0;
  const seriesType = activeSeries.type ? activeSeries.type.charAt(0).toUpperCase() + activeSeries.type.slice(1) : null;

  return (
    <div className="hs-cinema-section">
      {/* Arka plan görseli - her seri için ayrı key ile animasyon tetiklenir */}
      <div
        key={`cinema-bg-${activeSeries.id}`}
        className="hs-cinema-bg hs-cinema-bg-anim"
        style={{ backgroundImage: isAdultBlur ? 'none' : `url(${activeSeries.cover_url || '/demo/cover1.jpg'})` }}
      />
      <div className="hs-cinema-gradient" />
      <div className="hs-cinema-content">
        <div className="hscin-cover-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            key={`cinema-cover-${activeSeries.id}`}
            src={activeSeries.cover_url || '/demo/cover1.jpg'}
            alt={activeSeries.title}
            className="hscin-cover-img"
            style={isAdultBlur ? { filter: 'blur(14px)', transform: 'scale(1.1)' } : {}}
          />
          <AdultOverlay isAdult={activeSeries.is_adult} user={user} />
        </div>
        <div className="hscin-info">
          {seriesType && (
            <div className="hscin-type-badge">{seriesType}</div>
          )}
          <div className="hscin-title">{activeSeries.title}</div>
          <div className="hscin-meta">
            <span className="hscin-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {activeSeries.rating?.toFixed(1) || 'N/A'}
            </span>
            <span className="hscin-meta-sep">•</span>
            {chapterCount > 0 && (
              <>
                <span>{chapterCount} Bölüm</span>
                <span className="hscin-meta-sep">•</span>
              </>
            )}
            <span className="hscin-status-badge" data-status={activeSeries.status}>
              {activeSeries.status === 'ongoing' ? 'Devam Ediyor' :
               activeSeries.status === 'completed' ? 'Tamamlandı' :
               activeSeries.status === 'hiatus' ? 'Ara Verildi' :
               activeSeries.status || 'Bilinmiyor'}
            </span>
          </div>
          <div className="hscin-genres">
            {parseGenres(activeSeries.genres).slice(0, 4).map(g => (
              <span key={g} className="hscin-genre">{GENRE_TR[g] || g}</span>
            ))}
          </div>
          <p className="hscin-summary">
            {activeSeries.summary || 'Bu heyecan verici serinin yeni bölümlerini kaçırmayın. Hemen okumaya başlayın.'}
          </p>
          <div className="hscin-actions">
<Link href={isAdultBlur ? '/login' : `/series/${activeSeries.slug || activeSeries.id}`} className="hscin-btn">
            {isAdultBlur ? '🔒 18+ Giriş Yapın' : 'Hemen Oku'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
          {!isAdultBlur && (
            <Link href={`/series/${activeSeries.slug || activeSeries.id}`} className="hscin-btn-secondary">
              Detaylar
            </Link>
          )}
          </div>
        </div>
      </div>
      {/* Sayı göstergesi */}
      <div className="hscin-counter">
        <span className="hscin-counter-current">{String(slideIndex + 1).padStart(2, '0')}</span>
        <span className="hscin-counter-sep"> / </span>
        <span className="hscin-counter-total">{String(popularSeries.length).padStart(2, '0')}</span>
      </div>
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// 3. HOLOGRAFİK AKIŞ (Holo Cover Flow)
function HoloHero({ popularSeries, slideIndex, user, ...navProps }) {
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

          const isBlocked = s.is_adult && !user;
          return (
            <Link key={s.id} href={isBlocked ? '/login' : `/series/${s.slug || s.id}`} className={`hsh-slide${deckClass}`} style={{ position: 'relative', overflow: 'hidden', display: 'block' }}>
              <img className="hsh-cover" src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} style={isBlocked ? { filter: 'blur(14px)', transform: 'scale(1.1)' } : {}} />
              {isBlocked && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: 'inherit' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textAlign: 'center' }}>18+</span>
                </div>
              )}
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
function CascadeHero({ popularSeries, slideIndex, user, ...navProps }) {
  const activeSeries = popularSeries[slideIndex] || {};
  const len = popularSeries.length;
  if (len === 0) return null;
  const s1 = popularSeries[(slideIndex + 1) % len];
  const s2 = popularSeries[(slideIndex + 2) % len];
  const s3 = popularSeries[(slideIndex + 3) % len];
  const isAdultBlur = activeSeries.is_adult && !user;
  const chapterCount = activeSeries.chapterCount ?? activeSeries.chapter_count ?? 0;
  const genres = parseGenres(activeSeries.genres).slice(0, 3);

  return (
    <div className="hs-cascade-section">
      <div
        key={`cas-bg-${activeSeries.id}`}
        className="hs-cascade-bg"
        style={{ backgroundImage: `url(${activeSeries.cover_url || '/demo/cover1.jpg'})` }}
      />
      <div className="hs-cascade-active-area">
        {/* Kapak */}
        <div className="hscas-cover-wrap">
          <img
            key={`cas-cover-${activeSeries.id}`}
            className="hscas-cover"
            src={activeSeries.cover_url || '/demo/cover1.jpg'}
            alt={activeSeries.title}
            style={isAdultBlur ? { filter: 'blur(14px)', transform: 'scale(1.1)' } : {}}
          />
          {/* Puan rozeti */}
          {activeSeries.rating > 0 && !isAdultBlur && (
            <div className="hscas-rating-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {activeSeries.rating.toFixed(1)}
            </div>
          )}
          <AdultOverlay isAdult={activeSeries.is_adult} user={user} />
        </div>

        {/* Bilgi */}
        <div key={`cas-info-${activeSeries.id}`} className="hscas-info">
          {/* Etiket */}
          <div className="hscas-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            HAFTANIN POPÜLERİ
          </div>

          {/* Başlık */}
          <div className="hscas-title">{activeSeries.title}</div>

          {/* Meta bilgiler */}
          <div className="hscas-meta">
            {chapterCount > 0 && (
              <span className="hscas-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {chapterCount} Bölüm
              </span>
            )}
            {activeSeries.status && (
              <span className="hscas-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {activeSeries.status === 'ongoing' ? 'Devam Ediyor' :
                 activeSeries.status === 'completed' ? 'Tamamlandı' :
                 activeSeries.status === 'hiatus' ? 'Ara Verildi' : activeSeries.status}
              </span>
            )}
          </div>

          {/* Türler */}
          {genres.length > 0 && (
            <div className="hscas-genres">
              {genres.map(g => (
                <span key={g} className="hscas-genre-tag">{GENRE_TR[g] || g}</span>
              ))}
            </div>
          )}

          {/* Özet */}
          <p className="hscas-summary">
            {activeSeries.summary || 'Bu heyecan verici serinin yeni bölümlerini kaçırmayın. Hemen okumaya başlayın.'}
          </p>

          {/* Buton */}
          <Link
            href={isAdultBlur ? '/login' : `/series/${activeSeries.slug || activeSeries.id}`}
            className={`hscas-btn${isAdultBlur ? ' hscas-btn-adult' : ''}`}
          >
            {isAdultBlur ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                18+ Giriş Yapın
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                OKUMAYA BAŞLA
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Kademeli arka kartlar */}
      {len > 1 && (
        <div className="hs-cascade-steps">
          {len > 1 && s1 && (
            <Link href={`/series/${s1.slug || s1.id}`} className="hscas-step-card hscas-step-1">
              <img src={s1.cover_url || '/demo/cover1.jpg'} alt={s1.title} loading="lazy" />
              <div className="hscas-step-title">{s1.title}</div>
            </Link>
          )}
          {len > 2 && s2 && (
            <Link href={`/series/${s2.slug || s2.id}`} className="hscas-step-card hscas-step-2">
              <img src={s2.cover_url || '/demo/cover1.jpg'} alt={s2.title} loading="lazy" />
            </Link>
          )}
          {len > 3 && s3 && (
            <Link href={`/series/${s3.slug || s3.id}`} className="hscas-step-card hscas-step-3">
              <img src={s3.cover_url || '/demo/cover1.jpg'} alt={s3.title} loading="lazy" />
            </Link>
          )}
        </div>
      )}

      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// 5. SİBERPUNK VİTRİN (Cyberpunk Neon)
function CyberpunkHero({ popularSeries, slideIndex, user, ...navProps }) {
  return (
    <div className="hs-cyber-section">
      <div className="hs-cyber-track">
        {popularSeries.map((s, idx) => {
          const offset = ((idx - slideIndex + popularSeries.length) % popularSeries.length);
          const deckClass = idx === slideIndex ? ' active' : offset === 1 ? ' next' : offset === popularSeries.length - 1 ? ' prev' : ' hidden';
          return (
            <Link key={s.id} href={s.is_adult && !user ? '/login' : `/series/${s.slug || s.id}`} className={`hscy-slide${deckClass}`} style={{ position: 'relative', overflow: 'hidden', display: 'block' }}>
              <div className="hscy-inner">
                <img src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} style={s.is_adult && !user ? { filter: 'blur(14px)', transform: 'scale(1.1)' } : {}} />
              </div>
              {idx === slideIndex && <div className="hscy-glitch-text">{s.title}</div>}
              {s.is_adult && !user && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>18+</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <SliderNav popularSeries={popularSeries} slideIndex={slideIndex} {...navProps} />
    </div>
  );
}

// Yetişkin içerik overlay bileşeni — giriş yapılmamışsa kapağı bulanıklaştırır
function AdultOverlay({ isAdult, user }) {
  if (!isAdult || user) return null;
  return (
    <a
      href="/login"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textDecoration: 'none',
        color: '#fff',
        borderRadius: 'inherit',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'center', padding: '0 12px' }}>
        18+ İçerik<br/>
        <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.85 }}>Görüntülemek için giriş yapın</span>
      </span>
    </a>
  );
}

export default function HeroSliderWidget({ design, popularSeries }) {
  const { user } = useAuth();
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoplayRef = useRef(null);
  // touchStart/touchEnd state kaldırıldı — touchStartRef ile takip edildiğinden gereksiz re-render önlendi

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

  // useRef ile stale closure önlendi — setState kaldırıldı (gereksiz re-render önlendi)
  const touchStartRef = useRef(0);
  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const len = popularSeries.length;
    if (len <= 1) return;
    const diff = touchStartRef.current - endX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  if (!popularSeries || popularSeries.length === 0) return null;

  return (
    <div className="hero-slider-wrapper" ref={sliderRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {(() => {
        const navProps = { prevSlide, nextSlide, goToSlide };
        switch (design) {
          case 'hero_style2': return <CinemaHero popularSeries={popularSeries} slideIndex={slideIndex} user={user} {...navProps} />;
          case 'hero_style3': return <HoloHero popularSeries={popularSeries} slideIndex={slideIndex} user={user} {...navProps} />;
          case 'hero_style4': return <CascadeHero popularSeries={popularSeries} slideIndex={slideIndex} user={user} {...navProps} />;
          case 'hero_style5': return <CyberpunkHero popularSeries={popularSeries} slideIndex={slideIndex} user={user} {...navProps} />;
          case 'hero_style1':
          default:
            return <ClassicHero popularSeries={popularSeries} slideIndex={slideIndex} user={user} {...navProps} />;
        }
      })()}
    </div>
  );
}
