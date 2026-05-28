'use client';
import Link from 'next/link';

export default function CosmicTearCard({ href, coverUrl, title, children }) {
  return (
    <div className="cosmic-card group">
      <div className="cosmic-tear-container">
         <div className="cosmic-tear-glow"></div>
      </div>
      <div className="cosmic-card-inner">
        <Link href={href} className="cosmic-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
        </Link>
        <div className="cosmic-content">
          <Link href={href} className="cosmic-title">{title}</Link>
          <div className="cosmic-chapters">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
