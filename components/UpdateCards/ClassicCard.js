import Link from 'next/link';

export default function ClassicCard({ href, coverUrl, title, children }) {
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
