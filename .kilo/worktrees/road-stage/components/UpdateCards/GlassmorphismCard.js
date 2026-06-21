'use client';
import { memo } from 'react';
import Link from 'next/link';

const STATUS_COLORS = {
  ongoing:   { bg: 'rgba(16, 185, 129, 0.85)',  color: '#fff', dot: '#10b981' },
  completed: { bg: 'rgba(99, 102, 241, 0.85)',  color: '#fff', dot: '#6366f1' },
  hiatus:    { bg: 'rgba(245, 158, 11, 0.85)',  color: '#fff', dot: '#f59e0b' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.85)',   color: '#fff', dot: '#ef4444' },
  current:   { bg: 'rgba(6, 182, 212, 0.85)',   color: '#fff', dot: '#06b6d4' },
};
const DEFAULT_STATUS_COLOR = STATUS_COLORS.ongoing;

const cardStyle = {
  display: 'flex',
  flexDirection: 'row',
  background: 'rgba(20, 20, 26, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  overflow: 'hidden',
  height: '190px',
  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
};

const coverWrapStyle = {
  position: 'relative',
  width: '120px',
  minWidth: '120px',
  flexShrink: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const coverImgStyle = {
  display: 'block',
  width: '100%',
  flex: 1,
  minHeight: 0,
  objectFit: 'cover',
};

const typeBadgeStyle = {
  position: 'absolute',
  top: '7px',
  left: '7px',
  fontSize: '0.55rem',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(0,0,0,0.72)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.4,
  zIndex: 2,
  whiteSpace: 'nowrap',
};

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '12px 14px',
  minWidth: 0,
  overflow: 'hidden',
};

const titleLinkStyle = {
  textDecoration: 'none',
  marginBottom: '8px',
  flexShrink: 0,
};

const titleStyle = {
  fontSize: '0.95rem',
  fontWeight: 800,
  color: '#fff',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
};

const chaptersStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
  overflow: 'hidden',
};

function GlassmorphismCard({ href, coverUrl, title, type, status, statusKey, children }) {
  const sc = STATUS_COLORS[statusKey] || DEFAULT_STATUS_COLOR;

  const statusBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '4px 6px',
    background: sc.bg,
    color: sc.color,
    fontSize: '0.58rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const statusDotStyle = {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    flexShrink: 0,
  };

  return (
    <div style={cardStyle}>
      <Link href={href} style={coverWrapStyle}>
        <img src={coverUrl} alt={title} loading="lazy" style={coverImgStyle} />
        {type && <span style={typeBadgeStyle}>{type}</span>}
        {status && (
          <div style={statusBarStyle}>
            <span style={statusDotStyle} />
            {status}
          </div>
        )}
      </Link>

      <div style={contentStyle}>
        <Link href={href} style={titleLinkStyle}>
          <h3 style={titleStyle}>{title}</h3>
        </Link>
        <div style={chaptersStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default memo(GlassmorphismCard);