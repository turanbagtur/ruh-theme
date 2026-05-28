'use client';
import Link from 'next/link';

export default function CinematicCard({ href, coverUrl, title, children }) {
  return (
    <div className="cinematic-card group">
      <div className="cine-bg" style={{ backgroundImage: `url(${coverUrl})` }}></div>
      <div className="cine-overlay"></div>
      
      <div className="cine-content">
        <Link href={href} className="cine-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
        </Link>
        <div className="cine-info">
          <Link href={href} className="cine-title">{title}</Link>
          <div className="cine-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}