'use client';
import { memo } from 'react';
import Link from 'next/link';

function ClassicCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardStyle = {};
  if (cardBg) cardStyle.background = cardBg;
  if (cardBorder) cardStyle.borderColor = cardBorder;
  return (
    <div className="asura-card" style={cardStyle}>
      <Link href={href} className="asura-cover-wrapper">
        <img src={coverUrl} alt={title} loading="lazy" />
      </Link>
      <div className="asura-content">
        <Link href={href} className="asura-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
        <div className="asura-chapters">
          {children}
        </div>
      </div>
    </div>
  );
}

export default memo(ClassicCard);
