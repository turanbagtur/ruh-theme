'use client';
import { memo } from 'react';
import Link from 'next/link';

function GlassmorphismCard({ href, coverUrl, title, children }) {
  return (
    <div className="glass-card">
      <div className="glass-card-glow" />
      <div className="glass-card-inner">
        <Link href={href} className="glass-card-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
          <div className="glass-card-cover-overlay" />
        </Link>
        <div className="glass-card-content">
          <Link href={href} className="glass-card-title">{title}</Link>
          <div className="glass-card-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GlassmorphismCard);