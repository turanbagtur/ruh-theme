'use client';
import Link from 'next/link';

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '2px', transform: 'translateY(-1px)' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CrownIcon = () => (
  <svg className="crown-icon" width="28" height="28" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1" style={{ position: 'absolute', top: '-14px', left: '-12px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))', transform: 'rotate(-20deg)', zIndex: 10 }}>
    <path d="M2 22h20v-2H2v2zm2.5-4h15L22 5l-6.5 4.5L12 2 8.5 9.5 2 5l2.5 13z" />
  </svg>
);

// 1. Klasik (Mevcut Görünüm / mr3-widget)
export function ClassicMR({ series, index, lang_rating }) {
  return (
    <Link href={`/series/${series.slug || series.id}`} className="mr3-item">
      <div className={`mr3-badge mr3-badge-${Math.min(index + 1, 4)}`}>{index + 1}</div>
      <div className="mr3-cover">
        <img src={series.cover_url || '/demo/cover1.jpg'} alt={series.title} loading="lazy" />
      </div>
      <div className="mr3-info">
        <div className="mr3-title">{series.title}</div>
        <div className="mr3-meta">
          <span className="rating-pill" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'}
          </span>
          <span>{lang_rating || 'Puan'}</span>
        </div>
      </div>
    </Link>
  );
}

// 2. Kademeli Cam (Glass Steps)
export function GlassStepsMR({ series, index, lang_rating }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  return (
    <Link href={`/series/${series.slug || series.id}`} className="mr-glass-item">
      <div className="mr-glass-bg" style={{ backgroundImage: `url(${cover})` }}></div>
      <div className="mr-glass-overlay"></div>
      <div className="mr-glass-content">
        <div className="mr-glass-rank">#{index + 1}</div>
        <div className="mr-glass-cover">
          <img src={cover} alt={series.title} loading="lazy" />
        </div>
        <div className="mr-glass-info">
          <div className="mr-glass-title">{series.title}</div>
          <div className="mr-glass-meta" style={{ display: 'flex', alignItems: 'center' }}>
            <span><StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'} {lang_rating || 'Puan'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 3. Altın Taç (Golden Crown)
export function GoldenCrownMR({ series, index, lang_rating }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  const isTop3 = index < 3;
  const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
  
  return (
    <Link href={`/series/${series.slug || series.id}`} className={`mr-crown-item ${rankClass}`}>
      <div className="mr-crown-cover" style={{ position: 'relative' }}>
        {index === 0 && <CrownIcon />}
        <img src={cover} alt={series.title} loading="lazy" />
      </div>
      <div className="mr-crown-info">
        <div className="mr-crown-title">{series.title}</div>
        <div className="mr-crown-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="mr-crown-rank">#{index + 1}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center' }}>
            <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// 4. Siberpunk Neon (Cyberpunk)
export function CyberpunkMR({ series, index, lang_rating }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  return (
    <Link href={`/series/${series.slug || series.id}`} className="mr-cyber-item">
      <div className="mr-cyber-rank">
        {(index + 1).toString().padStart(2, '0')}
      </div>
      <div className="mr-cyber-cover">
        <img src={cover} alt={series.title} loading="lazy" />
      </div>
      <div className="mr-cyber-info">
        <div className="mr-cyber-title">{series.title}</div>
        <div className="mr-cyber-meta">
          SYS.RTG // {series.rating ? series.rating.toFixed(1) : 'N/A'}
        </div>
      </div>
    </Link>
  );
}

// 5. Anime Minimalist (Hover Reveal)
export function AnimeMinimalistMR({ series, index, lang_rating }) {
  const cover = series.cover_url || '/demo/cover1.jpg';
  return (
    <Link href={`/series/${series.slug || series.id}`} className="mr-anime-item">
      <div className="mr-anime-bg" style={{ backgroundImage: `url(${cover})` }}></div>
      <div className="mr-anime-overlay"></div>
      <div className="mr-anime-content">
        <div className="mr-anime-info">
          <div className="mr-anime-title">{series.title}</div>
          <div className="mr-anime-meta" style={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon /> {series.rating ? series.rating.toFixed(1) : 'N/A'} {lang_rating || 'Puan'}
          </div>
        </div>
        <div className="mr-anime-rank">{index + 1}</div>
      </div>
    </Link>
  );
}

export default function MostReadWidget({ design, topSeries, topLoading, lang_rating }) {
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
            return <GlassStepsMR key={s.id} series={s} index={idx} lang_rating={lang_rating} />;
          case 'mr_style3':
            return <GoldenCrownMR key={s.id} series={s} index={idx} lang_rating={lang_rating} />;
          case 'mr_style4':
            return <CyberpunkMR key={s.id} series={s} index={idx} lang_rating={lang_rating} />;
          case 'mr_style5':
            return <AnimeMinimalistMR key={s.id} series={s} index={idx} lang_rating={lang_rating} />;
          case 'mr_style1':
          default:
            return <ClassicMR key={s.id} series={s} index={idx} lang_rating={lang_rating} />;
        }
      })}
    </div>
  );
}
