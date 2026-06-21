'use client';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';

function HoloUpdateCard({ href, coverUrl, title, children, titleColor, cardBg, cardBorder }) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [glareOpacity, setGlareOpacity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isTouch || !cardRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const px = Math.min(100, Math.max(0, (x / rect.width) * 100));
      const py = Math.min(100, Math.max(0, (y / rect.height) * 100));
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
      const rotateY = ((x - rect.width  / 2) / (rect.width  / 2)) *  10;
      setRotation({ x: rotateX, y: rotateY });
      setPointer({ x: px, y: py });
      setGlareOpacity(1);
    });
  }, [isTouch]);

  const handleMouseEnter = useCallback(() => {
    if (isTouch) return;
    setIsHovered(true);
  }, [isTouch]);

  const handleMouseLeave = useCallback(() => {
    if (isTouch) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
    setPointer({ x: 50, y: 50 });
    setGlareOpacity(0);
  }, [isTouch]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const transformStyle = isHovered
    ? `perspective(900px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.03, 1.03, 1.03)`
    : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';

  return (
    <div
      className={`holo-card-container${isHovered ? ' hovered' : ''}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        transform: transformStyle,
        // GPU acceleration only when hovered to prevent layout jank
        willChange: isHovered ? 'transform' : 'auto'
      }}
    >
      {/* Soft accent glow border — outside card so overflow:hidden doesn't clip */}
      <div className="holo-neon-bg" />

      <div className="holo-card" style={{
        ...(cardBg ? { background: cardBg } : {}),
        ...(cardBorder ? { borderColor: cardBorder } : {}),
      }}>
        {/* Subtle specular highlight — follows cursor, white only */}
        <div
          className="holo-glare"
          style={{
            opacity: glareOpacity,
            background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* Content */}
        <div className="holo-card-inner">
          <Link href={href} className="holo-cover-wrapper">
            <img src={coverUrl} alt={title} loading="lazy" />
          </Link>
          <div className="holo-content">
            <Link href={href} className="holo-title" style={titleColor ? { color: titleColor } : undefined}>{title}</Link>
            <div className="holo-chapters">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(HoloUpdateCard);