'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function HoloUpdateCard({ href, coverUrl, title, children }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
      setIsTouch(true);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (isTouch || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12; // Inverted for natural tilt
    const rotateY = ((x - centerX) / centerX) * 12;
    
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    
    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 1 });
  };

  const handleMouseEnter = () => {
    if (isTouch) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
    setGlare({ ...glare, opacity: 0 });
  };

  const transformStyle = isHovered 
    ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

  return (
    <div 
      className={`holo-card-container ${isHovered ? 'hovered' : ''}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      <div className="holo-card">
        {/* Animated Neon Border Background */}
        <div className="holo-neon-bg"></div>
        
        {/* Interactive Holographic Glare */}
        <div 
          className="holo-glare" 
          style={{ 
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 50%)`
          }}
        ></div>

        {/* Content Container */}
        <div className="holo-card-inner">
          <Link href={href} className="holo-cover-wrapper">
            <img src={coverUrl} alt={title} loading="lazy" />
          </Link>
          <div className="holo-content">
            <Link href={href} className="holo-title">{title}</Link>
            <div className="holo-chapters">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
