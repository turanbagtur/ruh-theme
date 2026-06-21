'use client';
import { memo } from 'react';
import Link from 'next/link';

function CosmicTearCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardStyle = {};
  if (cardBg) cardStyle.background = cardBg;
  if (cardBorder) cardStyle.borderColor = cardBorder;
  return (
    <div className="cosmic-card group" style={cardStyle}>
      <div className="cosmic-tear-container">
         <div className="cosmic-tear-glow"></div>
      </div>
      <div className="cosmic-card-inner">
        <Link href={href} className="cosmic-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
        </Link>
        <div className="cosmic-content">
          <Link href={href} className="cosmic-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
          <div className="cosmic-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CosmicTearCard);
