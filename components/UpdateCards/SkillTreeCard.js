'use client';
import Link from 'next/link';

export default function SkillTreeCard({ href, coverUrl, title, children }) {
  return (
    <div className="skill-tree-card">
      <div className="st-header">
        <Link href={href} className="st-cover-wrapper">
          <img src={coverUrl} alt={title} loading="lazy" />
        </Link>
        <Link href={href} className="st-title">{title}</Link>
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
