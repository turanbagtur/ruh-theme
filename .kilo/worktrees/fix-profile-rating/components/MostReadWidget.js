'use client';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

// Yetişkin içerik mini overlay — kart tasarımını bozmaz
function AdultMiniOverlay({ isAdult, user }) {
  if (!isAdult || user) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)', borderRadius: 'inherit', pointerEvents: 'none',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.04em' }}>18+</span>
    </div>
  );
}

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '2px', transform: 'translateY(-1px)' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Altın taç — rank 1 (kart üzerinde yüzen ikon)
const CrownIcon = () => (
  <svg className="crown-icon" width="26" height="26" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1.2">
    <path d="M2 20h20v-2H2v2zm2-4h16l2-9-5.5 4L12 3 9.5 11 4 7l2 9z" />
  </svg>
);

// Gümüş madalya — rank 2 (kart üzerinde yüzen ikon, text yerine path)
const SilverMedalIcon = () => (
  <svg className="medal-icon" width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M10 4 L16 2 L22 4 L22 12 L16 14 L10 12 Z" fill="#A8A8A8" stroke="#888" strokeWidth="1.2"/>
    <circle cx="16" cy="22" r="9" fill="#C8C8C8" stroke="#999" strokeWidth="1.5"/>
    <circle cx="16" cy="22" r="6.5" fill="#E0E0E0" stroke="none"/>
    <rect x="13.5" y="17" width="2" height="10" rx="1" fill="#888"/>
    <path d="M13 23 Q16 20 19 23 Q16 26 13 23Z" fill="#888"/>
  </svg>
);

// Bronz madalya — rank 3 (kart üzerinde yüzen ikon, text yerine path)
const BronzeMedalIcon = () => (
  <svg className="medal-icon" width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M10 4 L16 2 L22 4 L22 12 L16 14 L10 12 Z" fill="#A05820" stroke="#8B4513" strokeWidth="1.2"/>
    <circle cx="16" cy="22" r="9" fill="#CD7F32" stroke="#8B4513" strokeWidth="1.5"/>
    <circle cx="16" cy="22" r="6.5" fill="#E09050" stroke="none"/>
    <path d="M13.5 18 Q16 17 18 18.5 Q19 20 16 21 Q19 22 18 24 Q16 26 13.5 25 L13.5 24 Q16 25 17 23.5 Q15 22.5 13.5 21.5 L13.5 21 Q15 20.5 17 19.5 Q16 18 13.5 19 Z" fill="#7B3A10"/>
  </svg>
);

// Rank pill içinde kullanılan ikon bileşenleri (küçük, satır içi)
const GoldPillIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#B8860B" stroke="none" style={{ flexShrink: 0 }}>
    <path d="M2 20h20v-2H2v2zm2-4h16l2-9-5.5 4L12 3 9.5 11 4 7l2 9z" />
  </svg>
);
const SilverPillIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="15" r="7"/>
    <path d="M8.5 3 L12 2 L15.5 3 L15.5 9 L12 10 L8.5 9 Z" fill="#999" stroke="#777" strokeWidth="1"/>
  </svg>
);
const BronzePillIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7B4010" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="15" r="7"/>
    <path d="M8.5 3 L12 2 L15.5 3 L15.5 9 L12 10 L8.5 9 Z" fill="#CD7F32" stroke="#8B4513" strokeWidth="1"/>
  </svg>
);
const RankPillIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

// 1. Klasik (Mevcut Görünüm / mr3-widget)
export function ClassicMR({ series, index, lang_rating, user }) {
  const isBlocked = series.is_adult && !user;
  return (
    <Link href={isBlocked ? '/login' : `/seri/${series.slug || series.id}`} className="mr3-item">
      <div className={`mr3-badge mr3-badge-${Math.min(index + 1, 4)}`}>{index + 1}</div>
      <div className="mr3-cover" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt={series.title} loading="lazy" style={isBlocked ? { filter: 'blur(8px)', transform: 'scale(1.1)' } : {}} />
        <AdultMiniOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="mr3-info">
        <div className="mr3-title">{isBlocked ? '18+ İçerik' : series.title}</div>
        {!isBlocked && (
          <div className="mr3-meta">
            <span className="rating-pill" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.78rem', gap: 3 }}>
              <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'}
            </span>
            <span style={{ fontSize: '0.78rem' }}>{lang_rating || 'Puan'}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// 2. Kademeli Cam (Glass Steps)
export function GlassStepsMR({ series, index, lang_rating, user }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  const isBlocked = series.is_adult && !user;
  return (
    <Link href={isBlocked ? '/login' : `/seri/${series.slug || series.id}`} className="mr-glass-item">
      <div className="mr-glass-bg" style={{ backgroundImage: isBlocked ? 'none' : `url(${cover})` }}></div>
      <div className="mr-glass-overlay"></div>
      <div className="mr-glass-content">
        <div className="mr-glass-rank">#{index + 1}</div>
        <div className="mr-glass-cover" style={{ position: 'relative', overflow: 'hidden' }}>
          <img src={cover} alt={series.title} loading="lazy" style={isBlocked ? { filter: 'blur(8px)', transform: 'scale(1.1)' } : {}} />
          <AdultMiniOverlay isAdult={series.is_adult} user={user} />
        </div>
        <div className="mr-glass-info">
          <div className="mr-glass-title">{isBlocked ? '18+ İçerik' : series.title}</div>
          {!isBlocked && (
            <div className="mr-glass-meta" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'} {lang_rating || 'Puan'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// 3. Altın Taç (Golden Crown)
export function GoldenCrownMR({ series, index, lang_rating, user }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  const isBlocked = series.is_adult && !user;
  const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
  // SVG ikonlu rank pill içeriği — emoji yok
  const RankPill = () => {
    if (index === 0) return <><GoldPillIcon /><span>#1</span></>;
    if (index === 1) return <><SilverPillIcon /><span>#2</span></>;
    if (index === 2) return <><BronzePillIcon /><span>#3</span></>;
    return <><RankPillIcon /><span>#{index + 1}</span></>;
  };

  return (
    <Link href={isBlocked ? '/login' : `/seri/${series.slug || series.id}`} className={`mr-crown-item ${rankClass}`}>
      {/* İkonlar doğrudan kart içinde — overflow:visible olan card'a göre konumlanır */}
      {index === 0 && !isBlocked && <CrownIcon />}
      {index === 1 && !isBlocked && <SilverMedalIcon />}
      {index === 2 && !isBlocked && <BronzeMedalIcon />}

      {/* Kapak — overflow:hidden yalnızca img kırpması için */}
      <div className="mr-crown-cover">
        <img src={cover} alt={isBlocked ? '18+ İçerik' : series.title} loading="lazy"
          style={isBlocked ? { filter: 'blur(8px)', transform: 'scale(1.1)' } : {}} />
        <AdultMiniOverlay isAdult={series.is_adult} user={user} />
      </div>

      <div className="mr-crown-info">
        <div className="mr-crown-title">{isBlocked ? '18+ İçerik' : series.title}</div>
        <div className="mr-crown-meta-row">
          <span className="mr-crown-rank-pill"><RankPill /></span>
          {!isBlocked && series.rating > 0 && (
            <span className="mr-crown-rating">
              <StarIcon /> {series.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// 4. Siberpunk Neon (Cyberpunk)
export function CyberpunkMR({ series, index, lang_rating, user }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  const isBlocked = series.is_adult && !user;
  return (
    <Link href={isBlocked ? '/login' : `/seri/${series.slug || series.id}`} className="mr-cyber-item">
      <div className="mr-cyber-rank">
        {(index + 1).toString().padStart(2, '0')}
      </div>
      <div className="mr-cyber-cover" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={cover} alt={series.title} loading="lazy" style={isBlocked ? { filter: 'blur(8px) grayscale(50%)', transform: 'scale(1.1)' } : {}} />
        <AdultMiniOverlay isAdult={series.is_adult} user={user} />
      </div>
      <div className="mr-cyber-info">
        <div className="mr-cyber-title">{isBlocked ? '18+ IÇERIK' : series.title}</div>
        {!isBlocked && (
          <div className="mr-cyber-meta" style={{ fontSize: '0.75rem' }}>
            SYS.RTG // {series.rating ? series.rating.toFixed(1) : 'N/A'}
          </div>
        )}
      </div>
    </Link>
  );
}

// 5. Anime Minimalist (Hover Reveal)
export function AnimeMinimalistMR({ series, index, lang_rating, user }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  const isBlocked = series.is_adult && !user;
  return (
    <Link href={isBlocked ? '/login' : `/seri/${series.slug || series.id}`} className="mr-anime-item" style={{ position: 'relative' }}>
      <div className="mr-anime-bg" style={{ backgroundImage: isBlocked ? 'none' : `url(${cover})`, ...(isBlocked ? { background: '#1a1a2e' } : {}) }}></div>
      <div className="mr-anime-overlay"></div>
      {isBlocked && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>18+ İçerik</span>
        </div>
      )}
      <div className="mr-anime-content">
        <div className="mr-anime-info">
          <div className="mr-anime-title">{isBlocked ? '🔞 Giriş Yapın' : series.title}</div>
          {!isBlocked && (
            <div className="mr-anime-meta" style={{ display: 'flex', alignItems: 'center', fontSize: '0.78rem', gap: 3 }}>
              <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'} {lang_rating || 'Puan'}
            </div>
          )}
        </div>
        <div className="mr-anime-rank">{index + 1}</div>
      </div>
    </Link>
  );
}

export default function MostReadWidget({ design, topSeries, topLoading, lang_rating }) {
  const { user } = useAuth();
  let listClass = "mr3-list";
  if (design === 'mr_style2') listClass = "mr-glass-list";
  else if (design === 'mr_style3') listClass = "mr-crown-list";
  else if (design === 'mr_style4') listClass = "mr-cyber-list";
  else if (design === 'mr_style5') listClass = "mr-anime-list";

  return (
    <div className={listClass} style={{ opacity: topLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      {topSeries.map((s, idx) => {
        switch (design) {
          case 'mr_style2':
            return <GlassStepsMR key={s.id} series={s} index={idx} lang_rating={lang_rating} user={user} />;
          case 'mr_style3':
            return <GoldenCrownMR key={s.id} series={s} index={idx} lang_rating={lang_rating} user={user} />;
          case 'mr_style4':
            return <CyberpunkMR key={s.id} series={s} index={idx} lang_rating={lang_rating} user={user} />;
          case 'mr_style5':
            return <AnimeMinimalistMR key={s.id} series={s} index={idx} lang_rating={lang_rating} user={user} />;
          case 'mr_style1':
          default:
            return <ClassicMR key={s.id} series={s} index={idx} lang_rating={lang_rating} user={user} />;
        }
      })}
    </div>
  );
}
