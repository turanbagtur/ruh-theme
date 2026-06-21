'use client';
import { memo } from 'react';
import Link from 'next/link';

function SkillTreeCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardStyle = {};
  if (cardBg) cardStyle.background = cardBg;
  if (cardBorder) cardStyle.borderColor = cardBorder;
  return (
    <div className="skill-tree-card" style={cardStyle}>
      <div className="st-header">
        <Link href={href} className="st-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
        </Link>
        <Link href={href} className="st-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
      </div>
      <div className="st-tree-container">
        <div className="st-tree-line"></div>
        <div className="st-chapters">
          {children}
        </div>
      </div>
    </div>
  );
}

export default memo(SkillTreeCard);
