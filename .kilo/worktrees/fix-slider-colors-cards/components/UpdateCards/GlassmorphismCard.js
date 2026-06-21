'use client';
import { memo } from 'react';
import Link from 'next/link';

function GlassmorphismCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardStyle = {};
  if (cardBg) cardStyle.background = cardBg;
  if (cardBorder) cardStyle.borderColor = cardBorder;
  return (
    <div className="glass-card" style={cardStyle}>
      <div className="glass-card-glow" />
      <div className="glass-card-inner">
        <Link href={href} className="glass-card-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
          <div className="glass-card-cover-overlay" />
        </Link>
        <div className="glass-card-content">
          <Link href={href} className="glass-card-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
          <div className="glass-card-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GlassmorphismCard);