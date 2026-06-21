'use client';
import { memo } from 'react';
import Link from 'next/link';

function CinematicCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardStyle = {};
  if (cardBg) cardStyle.background = cardBg;
  if (cardBorder) cardStyle.borderColor = cardBorder;
  return (
    <div className="cinematic-card group" style={cardStyle}>
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
          <Link href={href} className="cine-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
          <div className="cine-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CinematicCard);