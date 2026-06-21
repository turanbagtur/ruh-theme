'use client';
import { memo } from 'react';
import Link from 'next/link';

function ClassicCard({ href, coverUrl, title, children }) {
  return (
    <div className="asura-card">
      <Link href={href} className="asura-cover-wrapper">
        <img src={coverUrl} alt={title} loading="lazy" />
      </Link>
      <div className="asura-content">
        <Link href={href} className="asura-title">{title}</Link>
        <div className="asura-chapters">
          {children}
        </div>
      </div>
    </div>
  );
}

export default memo(ClassicCard);
