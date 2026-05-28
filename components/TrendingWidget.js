'use client';
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

const getStatusTr = (status) => {
  if (status === 'completed') return 'Tamamlandı';
  if (status === 'hiatus') return 'Ara Verildi';
  if (status === 'cancelled') return 'İptal Edildi';
  return 'Devam Ediyor';
};

// 1. Klasik (Mevcut Görünüm)
export function ClassicTrending({ series, index }) {
  return (
    <Link href={`/series/${series.slug || series.id}`} className="trending-card group">
      <div className="tc-cover">
        <span className={`tc-number rank-${index + 1}`}>{index + 1}</span>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
        <div className="tc-overlay" />
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
export function NeonTrending({ series, index }) {
  return (
    <Link href={`/series/${series.slug || series.id}`} className="trend-neon-card">
      <div className="tn-cover">
        <div className="tn-rank">{index + 1}</div>
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
      </div>
      <div className="tn-info">
        <div className="tn-title">{series.title}</div>
      </div>
    </Link>
  );
}

// 3. Geniş Pankart (Horizontal Banners)
export function BannerTrending({ series, index }) {
  return (
    <Link href={`/series/${series.slug || series.id}`} className="trend-banner-card">
      <div className="tb-cover">
        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
        <div className="tb-rank">#{index + 1}</div>
      </div>
      <div className="tb-info">
        <div className="tb-title">{series.title}</div>
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
      </div>
    </Link>
  );
}

// 4. Cam Küp 3D (Glass 3D)
export function Glass3DTrending({ series, index }) {
  return (
    <div className="trend-glass3d-container">
      <Link href={`/series/${series.slug || series.id}`} className="trend-glass3d-card" style={{ display: 'block' }}>
        <div className="tg-bg">
          <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
        </div>
        <div className="tg-overlay">
          <div className="tg-title">{series.title}</div>
        </div>
        <div className="tg-rank">#{index + 1}</div>
      </Link>
    </div>
  );
}

// 5. Alevli Yükseliş (Flaming Rise)
export function FlameTrending({ series, index }) {
  return (
    <Link href={`/series/${series.slug || series.id}`} className="trend-flame-card">
      <div className="tf-cover-wrapper">
        <div className="tf-cover">
          <img src={series.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
        </div>
        <div className="tf-rank">#{index + 1}</div>
      </div>
      <div className="tf-info">
        <div className="tf-title">{series.title}</div>
      </div>
    </Link>
  );
}

export default function TrendingWidget({ design, trending }) {
  return (
    <div className="trend-list-container">
      {trending.map((s, idx) => {
        switch (design) {
          case 'trend_style2':
            return <NeonTrending key={s.id} series={s} index={idx} />;
          case 'trend_style3':
            return <BannerTrending key={s.id} series={s} index={idx} />;
          case 'trend_style4':
            return <Glass3DTrending key={s.id} series={s} index={idx} />;
          case 'trend_style5':
            return <FlameTrending key={s.id} series={s} index={idx} />;
          case 'trend_style1':
          default:
            return <ClassicTrending key={s.id} series={s} index={idx} />;
        }
      })}
    </div>
  );
}
