'use client';
import { memo } from 'react';
import Link from 'next/link';

function NeonPulseCard({ href, coverUrl, title, children }) {
  return (
    <div className="neonpulse-card">
      <div className="neonpulse-accent-bar" />
      <div className="neonpulse-inner">
        <Link href={href} className="neonpulse-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
          <div className="neonpulse-cover-shine" />
        </Link>
        <div className="neonpulse-content">
          <Link href={href} className="neonpulse-title">{title}</Link>
          <div className="neonpulse-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(NeonPulseCard);