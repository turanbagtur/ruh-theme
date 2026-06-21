'use client';
import { memo } from 'react';
import Link from 'next/link';

function CinematicCard({ href, coverUrl, title, children }) {
  return (
    <div className="cinematic-card group">
      {/* Background uses lazy-load on hover via CSS */}
      <div 
        className="cine-bg"
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      <div className="cine-overlay" />

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

export default memo(CinematicCard);