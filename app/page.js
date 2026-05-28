'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import SeriesCard from '@/components/SeriesCard';
import ClassicCard from '@/components/UpdateCards/ClassicCard';
import CosmicTearCard from '@/components/UpdateCards/CosmicTearCard';
import SkillTreeCard from '@/components/UpdateCards/SkillTreeCard';
import HoloUpdateCard from '@/components/UpdateCards/HoloUpdateCard';
import CinematicCard from '@/components/UpdateCards/CinematicCard';
import MostReadWidget from '@/components/MostReadWidget';
import TrendingWidget from '@/components/TrendingWidget';
import HeroSliderWidget from '@/components/HeroSliderWidget';
import { useAuth } from '@/components/AuthProvider';

const GENRE_TR = {
    'Action': 'Aksiyon', 'Adventure': 'Macera', 'Comedy': 'Komedi', 'Drama': 'Drama',
    'Fantasy': 'Fantastik', 'Historical': 'Tarihi', 'Horror': 'Korku', 'Isekai': 'Isekai',
    'Martial Arts': 'Dövüş Sanatları', 'Mystery': 'Gizem', 'Reincarnation': 'Reenkarnasyon',
    'Romance': 'Romantik', 'School': 'Okul', 'Sci-Fi': 'Bilim Kurgu',
    'Supernatural': 'Doğaüstü', 'Thriller': 'Gerilim', 'Ecchi': 'Ecchi', 'Harem': 'Harem',
    'Josei': 'Josei', 'Mature': 'Yetişkin', 'Mecha': 'Mecha', 'Psychological': 'Psikolojik',
    'Seinen': 'Seinen', 'Shoujo': 'Shoujo', 'Shounen': 'Shounen', 'Slice of Life': 'Günlük Yaşam',
    'Sports': 'Spor', 'Tragedy': 'Trajedi', 'Webtoon': 'Webtoon', 'Manhwa': 'Manhwa', 'Manhua': 'Manhua'
};

const STATUS_TR = {
    'ongoing': 'Devam Ediyor',
    'completed': 'Tamamlandı',
    'hiatus': 'Ara Verildi',
    'cancelled': 'İptal Edildi'
};

function formatType(type) {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower === 'manga') return 'Manga';
    if (lower === 'manhwa') return 'Manhwa';
    if (lower === 'manhua') return 'Manhua';
    if (lower === 'webtoon') return 'Webtoon';
    if (lower === 'novel') return 'Roman';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function capitalizeFirst(str) {
    if (!str) return '';
    let first = str.charAt(0);
    if (first === 'i') first = 'İ';
    else if (first === 'ı') first = 'I';
    else if (first === 'ş') first = 'Ş';
    else if (first === 'ğ') first = 'Ğ';
    else if (first === 'ü') first = 'Ü';
    else if (first === 'ö') first = 'Ö';
    else if (first === 'ç') first = 'Ç';
    else first = first.toUpperCase();
    return first + str.slice(1);
}


function isDefaultTitle(title, chNum) {
    if (!title) return true;
    const cleanTitle = title.trim().toLowerCase();
    const cleanNum = String(chNum).trim().toLowerCase();
    const normalized = cleanTitle.replace(/\s+/g, ' ');
    const defaults = [
        `chapter ${cleanNum}`,
        `ch. ${cleanNum}`,
        `ch.${cleanNum}`,
        `bölüm ${cleanNum}`,
        `böl. ${cleanNum}`,
        `böl.${cleanNum}`,
        `bö. ${cleanNum}`,
        `bö.${cleanNum}`,
        `${cleanNum}. bölüm`,
        `${cleanNum}.bölüm`,
        `bölüm: ${cleanNum}`,
        `bölüm:${cleanNum}`,
        `bölüm-${cleanNum}`,
        `bölüm_${cleanNum}`,
        cleanNum
    ];
    return defaults.includes(normalized);
}

function toTitleCaseTr(str) {
    if (!str) return '';
    const lower = str.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
    return lower.split(' ').map(word => {
        if (!word) return '';
        let first = word.charAt(0);
        if (first === 'i') first = 'İ';
        else if (first === 'ı') first = 'I';
        else if (first === 'ş') first = 'Ş';
        else if (first === 'ğ') first = 'Ğ';
        else if (first === 'ü') first = 'Ü';
        else if (first === 'ö') first = 'Ö';
        else if (first === 'ç') first = 'Ç';
        else first = first.toUpperCase();
        return first + word.slice(1);
    }).join(' ');
}

export default function HomePage() {
  const { user, authFetch } = useAuth();
  const [popularSeries, setPopularSeries] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [updatesHasMore, setUpdatesHasMore] = useState(false);
  const [updatesLoadingMore, setUpdatesLoadingMore] = useState(false);
  const [readingHistory, setReadingHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [editorPicks, setEditorPicks] = useState([]);
  const [activeEPIndex, setActiveEPIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [topPeriod, setTopPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [topLoading, setTopLoading] = useState(false);
  const [stats, setStats] = useState({ series: 0, chapters: 0, users: 0 });
  const [mounted, setMounted] = useState(false);

  // Bug Report Modal State
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugMessage, setBugMessage] = useState('');
  const [bugMessageType, setBugMessageType] = useState('success');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time stats from dedicated endpoint
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats({
        series: data.series || 0,
        chapters: data.chapters || 0,
        users: data.users || 0,
      });
    } catch {}
  }, []);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [popRes, updRes, trendRes, edRes, annRes, settRes] = await Promise.all([
          fetch('/api/series?sort=popular&limit=5', { cache: 'no-store' }),
          fetch('/api/series/latest-updates?limit=16&page=1', { cache: 'no-store' }),
          fetch('/api/series/trending', { cache: 'no-store' }),
          fetch('/api/series/editor-pick', { cache: 'no-store' }),
          fetch('/api/announcements?active=true', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' })
        ]);
        const popData = await popRes.json();
        const updData = await updRes.json();
        const trendData = await trendRes.json();
        const edData = await edRes.json();
        const annData = await annRes.json();
        const settData = await settRes.json();

        setPopularSeries(popData.series || []);
        setLatestUpdates(updData.updates || []);
        setUpdatesHasMore(updData.hasMore || false);
        setTrending(trendData.series || []);
        setEditorPicks(Array.isArray(edData.series) ? edData.series : (edData.series ? [edData.series] : []));
        setAnnouncements(annData.announcements || []);
        if (settData.success) {
            setAppSettings(settData.settings || {});
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchTop() {
      setTopLoading(true);
      try {
        const res = await fetch(`/api/series/top?period=${topPeriod}`);
        const data = await res.json();
        setTopSeries(data.series || []);
      } catch (err) { console.error(err); }
      finally { setTopLoading(false); }
    }
    fetchTop();
  }, [topPeriod]);

  async function loadMoreUpdates() {
    if (updatesLoadingMore || !updatesHasMore) return;
    setUpdatesLoadingMore(true);
    try {
      const nextPage = updatesPage + 1;
      const res = await fetch(`/api/series/latest-updates?limit=16&page=${nextPage}`);
      const data = await res.json();
      
      if (data.updates) {
        setLatestUpdates(prev => [...prev, ...data.updates]);
      }
      setUpdatesHasMore(data.hasMore || false);
      setUpdatesPage(nextPage);
    } catch (err) { console.error(err); }
    finally { setUpdatesLoadingMore(false); }
  }

  // Fetch real reading history if logged in
  useEffect(() => {
    if (!user) return;
    async function fetchHistory() {
      try {
        const res = await authFetch('/api/users/reading-history');
        const data = await res.json();
        setReadingHistory(data.history || []);
      } catch { }
    }
    fetchHistory();
  }, [user, authFetch]);

  function parseGenres(g) {
    try { return Array.isArray(g) ? g : JSON.parse(g || '[]'); } catch { return []; }
  }

  // Format chapter number: shows "1" instead of "1.0", "1.5" for decimals
  function fmtCh(n) {
    const num = Number(n);
    if (isNaN(num)) return n;
    return num % 1 === 0 ? String(Math.floor(num)) : String(num);
  }

  function timeAgo(date) {
    if (!date) return '';
    const d = typeof date === 'string' && !date.endsWith('Z') ? date + 'Z' : date;
    const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    const justNow = appSettings.lang_time_just_now || 'şimdi';
    const minAgo = appSettings.lang_time_min_ago || ' dk önce';
    const hourAgo = appSettings.lang_time_hour_ago || ' sa önce';
    const dayAgo = appSettings.lang_time_day_ago || ' gün önce';
    if (seconds < 60) return justNow;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${minAgo}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${hourAgo}`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}${dayAgo}`;
    return new Date(date).toLocaleDateString('tr-TR');
  }

  async function handleBugSubmit(e) {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDesc.trim()) {
      setBugMessage('Lütfen tüm alanları doldurun.');
      setBugMessageType('error');
      return;
    }
    setBugSubmitting(true);
    setBugMessage('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: bugTitle, description: bugDesc })
      });
      const data = await res.json();
      if (data.success) {
        setBugMessage('Hata bildiriminiz başarıyla iletildi. Teşekkür ederiz!');
        setBugMessageType('success');
        setBugTitle('');
        setBugDesc('');
        setTimeout(() => setShowBugModal(false), 2000);
      } else {
        setBugMessage(data.error || 'Bildirim gönderilemedi.');
        setBugMessageType('error');
      }
    } catch (err) {
      setBugMessage('Bir hata oluştu, lütfen tekrar deneyin.');
      setBugMessageType('error');
    } finally {
      setBugSubmitting(false);
    }
  }

  return (
    <>
    <div className="home-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Popular Slider — tek kart transform slideshow ── */
        .pop-slider-section {
          position: relative;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 0;
          overflow: hidden;
        }
        .pop-slider-bg-blur {
          position: absolute;
          inset: -20px;
          background-size: cover;
          background-position: center;
          filter: blur(25px) brightness(0.4);
          transform: scale(1.1);
          z-index: 0;
          transition: background-image 0.5s ease;
        }
        .pop-slider-viewport {
          position: relative;
          z-index: 1;
          width: 260px;
          max-width: 100%;
          overflow: hidden;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        }
        .pop-slider-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
          will-change: transform;
        }
        /* her slayt */
        .pop-slide {
          flex: 0 0 100%;
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: var(--bg-card);
          display: block;
          text-decoration: none;
        }
        .pop-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* gradient alt */
        .pop-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 45%,
            rgba(0,0,0,0.65) 75%,
            rgba(0,0,0,0.92) 100%
          );
          pointer-events: none;
        }
        /* puan — sol üst */
        .pop-slide-rating {
          position: absolute;
          top: 10px;
          left: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0,0,0,0.70);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 20px;
          padding: 4px 9px;
          font-size: 0.80rem;
          font-weight: 700;
          color: #f59e0b;
          z-index: 5;
        }
        /* seri adı — alt orta */
        .pop-slide-title {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px 12px 14px;
          text-align: center;
          z-index: 5;
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.3;
          text-shadow: 0 2px 8px rgba(0,0,0,0.9);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* ok butonları — viewport içinde */
        .pop-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(8,8,12,0.78);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .pop-nav-btn:hover {
          background: var(--accent, #b91c1c);
          border-color: var(--accent, #b91c1c);
          transform: translateY(-50%) scale(1.1);
        }
        .pop-nav-btn.prev { left: 8px; }
        .pop-nav-btn.next { right: 8px; }
        /* nokta göstergesi */
        .pop-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
        }
        .pop-dot {
          height: 5px;
          border-radius: 10px;
          background: rgba(255,255,255,0.22);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.25s ease;
        }
        .pop-dot.active { width: 22px; background: var(--accent, #b91c1c); }
        .pop-dot:not(.active) { width: 6px; }
        /* iskelet */
        .pop-slider-skel {
          width: 260px;
          max-width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 14px;
          background: linear-gradient(90deg, var(--bg-card) 25%, rgba(255,255,255,0.04) 50%, var(--bg-card) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          margin-bottom: 12px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Banners ───────────────────────────────────────── */
        .banners-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
          margin-top: 10px;
        }
        .banner-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 12px;
          background: var(--bg-card, #1c1c24);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, border-color 0.2s ease;
          gap: 14px;
          text-decoration: none;
          cursor: pointer;
        }
        .banner-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.12);
        }
        .banner-card-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .banner-card-title {
          font-size: 0.92rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .banner-card-desc {
          font-size: 0.72rem;
          color: var(--text-muted, #94a3b8);
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .banner-card-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          border: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .banner-card-btn:hover { opacity: 0.88; }
        .discord-banner {
          border-left: 3px solid #5865F2;
          background: linear-gradient(90deg, rgba(88, 101, 242, 0.05) 0%, transparent 100%), var(--bg-card, #1c1c24);
        }
        .discord-btn { background: #5865F2; color: #fff; }
        .report-banner {
          border-left: 3px solid #ef4444;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%), var(--bg-card, #1c1c24);
        }
        .report-btn { background: #ef4444; color: #fff; }

        @media (max-width: 640px) {
          .pop-slider-viewport { width: 200px; }
          .pop-slider-skel { width: 200px; }
          .pop-slide-title { font-size: 0.82rem; }
          .banners-grid { grid-template-columns: 1fr; gap: 10px; }
          .banner-card { padding: 12px 14px; gap: 10px; }
          .banner-card-title { font-size: 0.85rem; }
          .banner-card-desc { font-size: 0.68rem; }
          .banner-card-btn { padding: 7px 12px; font-size: 0.78rem; }
        }
        @media (max-width: 380px) {
          .pop-slider-viewport { width: 170px; }
          .pop-slider-skel { width: 170px; }
          .banner-card-btn { padding: 6px 10px; font-size: 0.74rem; }
        }

        /* Responsive override: show multiple popular cards instead of one oversized slide */
        .pop-slider-section {
          align-items: stretch;
          margin-bottom: 10px;
        }
        .pop-slider-viewport {
          width: 100% !important;
          overflow: visible;
          border-radius: 0;
          box-shadow: none;
        }
        .pop-slider-track {
          gap: 16px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding: 4px 2px 12px;
        }
        .pop-slider-track::-webkit-scrollbar { display: none; }
        .pop-slide {
          flex: 0 0 calc((100% - 64px) / 5);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 8px 20px rgba(0,0,0,0.28);
          scroll-snap-align: start;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pop-slide:hover {
          transform: translateY(-4px);
          border-color: rgba(239,68,68,0.45);
          box-shadow: 0 14px 28px rgba(0,0,0,0.38);
        }
        .pop-nav-btn.prev { left: -18px; }
        .pop-nav-btn.next { right: -18px; }
        .pop-slider-skel {
          width: 100% !important;
          height: clamp(180px, 24vw, 300px);
          aspect-ratio: auto;
        }
        @media (max-width: 1024px) {
          .pop-slide { flex-basis: calc((100% - 32px) / 3); }
          .pop-nav-btn.prev { left: -10px; }
          .pop-nav-btn.next { right: -10px; }
        }
        @media (max-width: 640px) {
          .pop-slider-track { gap: 12px; padding-bottom: 10px; }
          .pop-slide { flex-basis: calc((100% - 12px) / 2); }
          .pop-nav-btn { display: none; }
          .pop-slider-skel { height: 240px; }
        }
        @media (max-width: 380px) {
          .pop-slide { flex-basis: 78%; }
          .pop-slider-skel { height: 220px; }
        }

        /* Spotlight deck slider: active cover is larger, side covers stay visible */
        .pop-slider-section {
          align-items: center;
          margin-bottom: 22px;
        }
        .pop-slider-viewport {
          width: 100% !important;
          height: clamp(330px, 36vw, 430px);
          overflow: hidden;
          border-radius: 0;
          box-shadow: none;
          isolation: isolate;
        }
        .pop-slider-viewport::before {
          content: '';
          position: absolute;
          inset: 12% 0 0;
          background: radial-gradient(circle at 50% 45%, rgba(var(--accent-rgb), 0.24), rgba(8,8,12,0.88) 68%);
          filter: blur(6px);
          z-index: 0;
          pointer-events: none;
        }
        .pop-slider-track {
          position: relative;
          height: 100%;
          overflow: hidden;
          display: block;
          padding: 0;
          scroll-snap-type: none;
        }
        .pop-slide {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(34vw, 250px);
          min-width: 0;
          max-width: none;
          flex: none;
          aspect-ratio: 3 / 4.2;
          border-radius: 8px;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.72);
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, filter 0.32s ease;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 22px 48px rgba(0,0,0,0.54);
        }
        .pop-slide.active {
          opacity: 1;
          z-index: 4;
          pointer-events: auto;
          transform: translate(-50%, -50%) scale(1);
          filter: none;
        }
        .pop-slide.prev,
        .pop-slide.next {
          opacity: 0.72;
          z-index: 2;
          pointer-events: auto;
          filter: saturate(0.82) brightness(0.78);
        }
        .pop-slide.prev {
          transform: translate(calc(-50% - min(28vw, 260px)), -50%) scale(0.64);
        }
        .pop-slide.next {
          transform: translate(calc(-50% + min(28vw, 260px)), -50%) scale(0.64);
        }
        .pop-slide.hidden {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.54);
          pointer-events: none;
        }
        .pop-slide:hover {
          border-color: rgba(255,255,255,0.16);
          box-shadow: 0 26px 54px rgba(0,0,0,0.62);
        }
        .pop-slide.active:hover {
          transform: translate(-50%, -50%) scale(1.025);
        }
        .pop-slide.prev:hover {
          transform: translate(calc(-50% - min(28vw, 260px)), -50%) scale(0.67);
        }
        .pop-slide.next:hover {
          transform: translate(calc(-50% + min(28vw, 260px)), -50%) scale(0.67);
        }
        .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:first-child {
          opacity: 1;
          z-index: 4;
          pointer-events: auto;
          transform: translate(-50%, -50%) scale(1);
          filter: none;
        }
        .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:nth-child(2),
        .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:last-child {
          opacity: 0.72;
          z-index: 2;
          pointer-events: auto;
          filter: saturate(0.82) brightness(0.78);
        }
        .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:nth-child(2) {
          transform: translate(calc(-50% + min(28vw, 260px)), -50%) scale(0.64);
        }
        .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:last-child {
          transform: translate(calc(-50% - min(28vw, 260px)), -50%) scale(0.64);
        }
        .pop-slide-title {
          text-align: left;
          padding: 0 12px 12px;
          font-size: 0.84rem;
        }
        .pop-slide-rating {
          top: 8px;
          left: 8px;
          border-radius: 4px;
          padding: 3px 7px;
        }
        .pop-nav-btn.prev { left: 14px; }
        .pop-nav-btn.next { right: 14px; }
        .pop-dots {
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .pop-slider-viewport {
            height: 300px;
            width: 100% !important;
          }
          .pop-slide {
            width: min(52vw, 185px);
          }
          .pop-slide.prev {
            transform: translate(calc(-50% - 38vw), -50%) scale(0.60);
          }
          .pop-slide.next {
            transform: translate(calc(-50% + 38vw), -50%) scale(0.60);
          }
          .pop-slide.prev:hover {
            transform: translate(calc(-50% - 38vw), -50%) scale(0.60);
          }
          .pop-slide.next:hover {
            transform: translate(calc(-50% + 38vw), -50%) scale(0.60);
          }
          .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:nth-child(2) {
            transform: translate(calc(-50% + 38vw), -50%) scale(0.60);
          }
          .pop-slider-track:not(:has(.pop-slide.active)) .pop-slide:last-child {
            transform: translate(calc(-50% - 38vw), -50%) scale(0.60);
          }
          .pop-slide-title {
            font-size: 0.76rem;
          }
          .pop-dots {
            margin-top: 0;
          }
          /* Re-enable nav buttons (hidden by multi-card override) */
          .pop-nav-btn {
            display: flex !important;
            width: 30px;
            height: 30px;
          }
          .pop-nav-btn.prev { left: 6px; }
          .pop-nav-btn.next { right: 6px; }
        }

        @media (max-width: 768px) {
          .stats-bar {
            margin-top: 28px !important;
          }
          .stats-bar-inner {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 16px 14px !important;
            align-items: stretch !important;
            justify-content: initial !important;
            flex-wrap: initial !important;
          }
          .stats-bar .stat-item {
            min-width: 0 !important;
            width: 100%;
            justify-content: center;
            gap: 8px;
            padding: 10px 8px;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            background: rgba(255,255,255,0.025);
          }
          .stats-bar .stat-item svg {
            width: 18px;
            height: 18px;
          }
          .stats-bar .stat-number {
            font-size: 1rem;
          }
          .stats-bar .stat-label {
            font-size: 0.64rem;
            letter-spacing: 0;
            white-space: nowrap;
          }
          .stats-bar .stat-divider {
            display: none !important;
          }
        }
        @media (max-width: 420px) {
          .stats-bar-inner {
            grid-template-columns: 1fr !important;
            padding: 14px 16px !important;
          }
          .stats-bar .stat-item {
            justify-content: flex-start;
            padding: 12px 14px;
          }
          .stats-bar .stat-number {
            font-size: 1.12rem;
          }
        }

        @keyframes flame-bounce {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-2px) scale(1.15); }
        }
      ` }} />
      {/* Popular Series — Devasa Hero Slider */}
      <div className="page-container page-section pt-0">
        {(loading || !mounted) && <div className="pop-slider-skel" />}
        {mounted && !loading && popularSeries.length > 0 && (
          <HeroSliderWidget design={appSettings.hero_slider_design || 'hero_style1'} popularSeries={popularSeries} />
        )}
      </div>

      {/* Side-by-Side Banners: Discord and Bug Report */}
      {!loading && (appSettings.discord_enabled === '1' || appSettings.bug_report_enabled === '1') && (
        <section className="page-container page-section pt-0" style={{ paddingBottom: '20px' }}>
          <div className="banners-grid">
            {appSettings.discord_enabled === '1' && (
              <a
                href={appSettings.discord_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="banner-card discord-banner"
                style={{ textDecoration: 'none' }}
              >
                <div className="banner-card-info">
                  <h4 className="banner-card-title">{appSettings.discord_title || 'Discord Sunucumuza Katıl'}</h4>
                  <p className="banner-card-desc">{appSettings.discord_text || 'Güncellemeler burada ilk paylaşılır, topluluğa katıl!'}</p>
                </div>
                <span className="banner-card-btn discord-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                  </svg>
                  Katıl
                </span>
              </a>
            )}

            {appSettings.bug_report_enabled === '1' && (
              <div
                className="banner-card report-banner"
                onClick={() => setShowBugModal(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowBugModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="banner-card-info">
                  <h4 className="banner-card-title">{appSettings.bug_report_title || 'Hata Bildir'}</h4>
                  <p className="banner-card-desc">{appSettings.bug_report_text || 'Sorun mu var? Bize bildirin, hızlıca çözelim.'}</p>
                </div>
                <span className="banner-card-btn report-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                  </svg>
                  Bildir
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Announcements Bar */}
      {announcements.length > 0 && (
        <section className="page-container page-section pt-0" style={{ paddingBottom: '10px' }}>
          <div className="announcements-bar">
            {announcements.map(ann => (
              <div key={ann.id} className="ann-item">
                <span className="ann-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  {appSettings.lang_announcement_label || 'DUYURU'}
                </span>
                {ann.link_url ? (
                  <a href={ann.link_url} target="_blank" rel="noopener noreferrer" className="ann-message">{ann.message}</a>
                ) : (
                  <span className="ann-message">{ann.message}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Donation Banner */}
      {!loading && appSettings?.donation_enabled === '1' && (
        <section className="page-container page-section pt-0" style={{ paddingBottom: '10px' }}>
             <div className="donation-banner">
                <div className="donation-banner-content">
                    <svg className="donation-heart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>{appSettings.donation_text || 'Sunucularımızı ayakta tutabilmemiz için bize destek olun!'}</span>
                </div>
                <div className="donation-banner-actions">
                    {appSettings.paypal_url && (
                        <a href={appSettings.paypal_url} target="_blank" rel="noopener noreferrer" className="donation-btn paypal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h4.5l.5-3.5h3.5a5.5 5.5 0 0 0 0-11H7z"/><path d="M10 14h5a3.5 3.5 0 0 0 0-7h-5z"/></svg> PayPal
                        </a>
                    )}
                    {appSettings.kofi_url && (
                        <a href={appSettings.kofi_url} target="_blank" rel="noopener noreferrer" className="donation-btn kofi">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> Ko-fi
                        </a>
                    )}
                </div>
             </div>
          </section>
        )}

      {/* Continue Reading (Homepage) */}
      {user && readingHistory.length > 0 && (
          <section className="page-container page-section pt-0" style={{ paddingBottom: '14px' }}>
             <Link href={`/read/${readingHistory[0].chapter_id}`} className="continue-reading-card group">
                <div className="cr-cover-wrapper">
                    <img src={readingHistory[0].cover_url || '/demo/cover1.jpg'} alt="" className="cr-cover" />
                </div>
                <div className="cr-info">
                   <span className="cr-subtitle">{appSettings.lang_continue_reading || 'OKUMAYA DEVAM ET'}</span>
                   <h3 className="cr-title">{readingHistory[0].series_title}</h3>
                   <span className="cr-chapter">
                      Bölüm {fmtCh(readingHistory[0].chapter_number)}
                      {readingHistory[0].latest_chapter && readingHistory[0].latest_chapter > readingHistory[0].chapter_number ?
                          <span className="cr-badge">{Math.floor(readingHistory[0].latest_chapter - readingHistory[0].chapter_number)} {appSettings.lang_new_badge || 'Yeni'}</span> : null
                      }
                    </span>
                </div>
                <div className="cr-action">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
             </Link>
          </section>
      )}

      {/* Trending Series (Numbered) - Full Width Grid above the split */}
      {!loading && trending.length > 0 && (
        <section className="page-container page-section pt-0">
          <div className="section-header">
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
              {appSettings.lang_trending_right_now || 'Şu Anda Trend Olanlar'}
            </h2>
          </div>
          <TrendingWidget design={appSettings.trending_design || 'trend_style1'} trending={trending} />
        </section>
      )}

      {/* MAIN LAYOUT: 2-COLUMN STRUCTURE (SCANLATION STYLE) */}
      <section className="page-container page-section pt-0 pb-40">
        <div className="main-layout">
          
          {/* LEFT COLUMN: LATEST UPDATES */}
          <div className="main-content">
            <div className="section-header">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {appSettings.lang_latest_updates || 'Son Güncellemeler'}
              </h2>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner"></div></div>
            ) : (
              <div className="updates-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '12px' }}>
                {latestUpdates.map(s => {
                  let CardComponent;
                  switch (appSettings.latest_updates_design) {
                    case 'style1': CardComponent = ClassicCard; break;
                    case 'style2': CardComponent = CosmicTearCard; break;
                    case 'style3': CardComponent = SkillTreeCard; break;
                    case 'style4': CardComponent = HoloUpdateCard; break;
                    case 'style5': CardComponent = CinematicCard; break;
                    default: CardComponent = HoloUpdateCard; break;
                  }
                  return (
                  <CardComponent
                    key={s.id}
                    href={`/series/${s.slug || s.id}`}
                    coverUrl={s.cover_url || '/demo/cover1.jpg'}
                    title={s.title}
                  >
                        {s.chapters && s.chapters.map(ch => {
                          const chWord = appSettings.lang_chapter_word || 'Bölüm';
                          const chPrefix = appSettings.lang_chapter_prefix || 'Bölüm';
                          const hasCustomTitle = ch.title && !isDefaultTitle(ch.title, ch.chapter_number);
                          // 24-hour highlight — server flag + client fallback
                          const isNew = (() => {
                            if (appSettings.show_new_chapter_badge === '0') return false;
                            if (ch.is_new === 1 || ch.is_new === true) return true;
                            if (!ch.created_at) return false;
                            // Parse as UTC safely
                            const dateStr = String(ch.created_at);
                            const normalized = dateStr.includes('T') ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z') : dateStr.replace(' ', 'T') + 'Z';
                            const ts = new Date(normalized).getTime();
                            if (isNaN(ts)) return false;
                            return (Date.now() - ts) < 24 * 60 * 60 * 1000;
                          })();
                          return (
                            <Link key={ch.id} href={`/read/${ch.id}`} className={`holo-chapter-row${isNew ? ' is-new' : ''}`} suppressHydrationWarning>
                              <span className="name" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', maxWidth: '100%', overflow: 'hidden' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {hasCustomTitle
                                    ? `${chPrefix} ${fmtCh(ch.chapter_number)} - ${ch.title}`
                                    : `${chWord} ${fmtCh(ch.chapter_number)}`}
                                </span>
                                {isNew && (
                                  <span 
                                    className="new-chapter-badge-pill"
                                    title="Son 24 saatte yüklendi!"
                                  />
                                )}
                              </span>
                              <span className="time" suppressHydrationWarning>{timeAgo(ch.created_at)}</span>
                              
                            </Link>
                          );
                        })}
                        {(!s.chapters || s.chapters.length === 0) && (
                          <span className="holo-chapter-row" style={{ opacity: 0.5 }}>{appSettings.lang_no_chapters_yet || 'Henüz bölüm yok'}</span>
                        )}
                  </CardComponent>
                )})}
              </div>
            )}
            
            {!loading && updatesHasMore && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={loadMoreUpdates} 
                  disabled={updatesLoadingMore}
                >
                  {updatesLoadingMore ? 'Yükleniyor...' : (appSettings.lang_load_more_updates || 'Daha Fazla Güncelleme')}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <aside className="sidebar">
            
            {/* User Continue Reading Widget */}
            {user && readingHistory.length > 0 && (
              <div className="sidebar-widget">
                <div className="widget-header">
                  <h3>{appSettings.lang_continue_reading || 'Okumaya Devam Et'}</h3>
                  <Link href="/profile">Tümü →</Link>
                </div>
                <div className="sidebar-list">
                  {readingHistory.slice(0, 3).map(item => (
                    <Link key={item.chapter_id} href={`/read/${item.chapter_id}`} className="sidebar-item">
                      <img src={item.cover_url || '/demo/cover1.jpg'} alt="" />
                      <div className="si-info">
                        <span className="si-title">{item.series_title}</span>
                        <span className="si-sub">Bölüm {fmtCh(item.chapter_number)} — Devam Et</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Editor's Pick Widget (Deck stack carousel) */}
            {!loading && editorPicks.length > 0 && (() => {
              const activeEP = editorPicks[activeEPIndex] || editorPicks[0] || {};
              const prevEP = editorPicks[(activeEPIndex - 1 + editorPicks.length) % editorPicks.length] || activeEP;
              const nextEP = editorPicks[(activeEPIndex + 1) % editorPicks.length] || activeEP;
              
              if (!activeEP.id) return null;
              
              return (
                <div className="sidebar-widget epw-deck-widget" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {toTitleCaseTr(appSettings.lang_editors_pick || 'Editörün Seçimi')}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Sizin için seçilen en iyiler
                    </p>
                  </div>
                  
                  {/* 3D Cover Deck Container */}
                  <div className="epw-deck-container" style={{ position: 'relative', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0 20px 0' }}>
                    
                    {/* Left (Previous) Card */}
                    {editorPicks.length > 1 && (
                      <div 
                        key={`epw-prev-${prevEP.id}`}
                        className="epw-deck-card prev" 
                        onClick={() => setActiveEPIndex((activeEPIndex - 1 + editorPicks.length) % editorPicks.length)}
                        style={{ 
                          position: 'absolute', 
                          width: '140px', 
                          height: '210px', 
                          borderRadius: '12px', 
                          overflow: 'hidden', 
                          transform: 'translateX(-65px) scale(0.85) rotate(-6deg)', 
                          opacity: 0.45, 
                          zIndex: 1, 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                        }}
                      >
                        <img src={prevEP.cover_url || '/demo/cover1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Right (Next) Card */}
                    {editorPicks.length > 1 && (
                      <div 
                        key={`epw-next-${nextEP.id}`}
                        className="epw-deck-card next" 
                        onClick={() => setActiveEPIndex((activeEPIndex + 1) % editorPicks.length)}
                        style={{ 
                          position: 'absolute', 
                          width: '140px', 
                          height: '210px', 
                          borderRadius: '12px', 
                          overflow: 'hidden', 
                          transform: 'translateX(65px) scale(0.85) rotate(6deg)', 
                          opacity: 0.45, 
                          zIndex: 1, 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                        }}
                      >
                        <img src={nextEP.cover_url || '/demo/cover1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Active (Center) Card */}
                    <div 
                      key={`epw-active-${activeEP.id}`}
                      className="epw-deck-card active" 
                      style={{ 
                        position: 'absolute', 
                        width: '160px', 
                        height: '240px', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        transform: 'scale(1) translateX(0)', 
                        opacity: 1, 
                        zIndex: 3, 
                        transition: 'all 0.3s ease',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.6)',
                        border: '2px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <img src={activeEP.cover_url || '/demo/cover1.jpg'} alt={activeEP.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* Navigation Arrow Overlays */}
                      {editorPicks.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveEPIndex((activeEPIndex - 1 + editorPicks.length) % editorPicks.length); }}
                            style={{
                              position: 'absolute',
                              left: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(12, 12, 15, 0.7)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'white',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              zIndex: 4,
                              padding: 0
                            }}
                            aria-label="Previous"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveEPIndex((activeEPIndex + 1) % editorPicks.length); }}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(12, 12, 15, 0.7)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'white',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              zIndex: 4,
                              padding: 0
                            }}
                            aria-label="Next"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dots Pill Indicator */}
                  {editorPicks.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                      {editorPicks.map((_, idx) => {
                        const isActive = idx === activeEPIndex;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => setActiveEPIndex(idx)}
                            style={{
                              padding: 0,
                              border: 'none',
                              width: isActive ? '20px' : '6px',
                              height: '6px',
                              borderRadius: '10px',
                              background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Details Section — animated on index change */}
                  <div key={`ep-details-${activeEPIndex}`} className="epw-deck-content-animate" style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {activeEP.title}
                    </h4>
                    
                    {activeEP.description && (
                      <p style={{ 
                        fontSize: '0.78rem', 
                        color: 'var(--text-secondary)', 
                        margin: '6px 0 12px 0', 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                      }}>
                        {activeEP.description}
                      </p>
                    )}

                    {/* Badges Row */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {formatType(activeEP.type)}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                        {STATUS_TR[activeEP.status] || activeEP.status}
                      </span>
                    </div>

                    {/* Buttons Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Link 
                        href={`/series/${activeEP.slug || activeEP.id}`} 
                        className="btn btn-primary" 
                        style={{ 
                          padding: '10px 12px', 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px', 
                          borderRadius: '8px',
                          background: 'var(--accent)'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        {appSettings.lang_start_reading || 'Şimdi Oku'}
                      </Link>
                      <Link 
                        href={`/series/${activeEP.slug || activeEP.id}`} 
                        className="btn btn-ghost" 
                        style={{ 
                          padding: '10px 12px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px', 
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        Takip Et
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Most Read Widget — v3 (reference style) */}
            <div className="mr3-widget">
              {/* Header row: title left, tabs right */}
              <div className="mr3-header">
                <h3 className="mr3-title">{appSettings.lang_most_read || 'En Çok Okunanlar'}</h3>
                <div className="mr3-tabs">
                  {[
                    ['daily', appSettings.lang_period_daily || 'Günlük'],
                    ['weekly', appSettings.lang_period_weekly || 'Haftalık'],
                    ['monthly', appSettings.lang_period_monthly || 'Aylık'],
                    ['all', appSettings.lang_period_all || 'Tümü'],
                  ].map(([key, label]) => (
                    <button key={key} className={`mr3-tab ${topPeriod === key ? 'active' : ''}`} onClick={() => setTopPeriod(key)}>
                      {capitalizeFirst(label)}
                    </button>
                  ))}
                </div>
              </div>

                <MostReadWidget 
                design={appSettings.most_read_design || 'mr_style1'} 
                topSeries={topSeries} 
                topLoading={topLoading} 
                lang_rating={appSettings.lang_rating} 
              />
              {!topLoading && topSeries.length === 0 && (
                  <div className="empty-text" style={{padding:'20px 0',textAlign:'center'}}>{appSettings.lang_no_views || 'Henüz görüntülenme kaydedilmedi.'}</div>
              )}
            </div>

          </aside>
        </div>
      </section>

      {/* Stats Bar — Bottom (shown only when show_stats_bar != '0') */}
      {appSettings.show_stats_bar !== '0' && (
        <div className="stats-bar" style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="stats-bar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '28px 20px', flexWrap: 'nowrap' }}>
            <div className="stat-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
              <div className="stat-content">
                <span className="stat-number">{stats.series}</span>
                <span className="stat-label">{appSettings.lang_stat_series || 'Seri'}</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <div className="stat-content">
                <span className="stat-number">{stats.chapters}</span>
                <span className="stat-label">{appSettings.lang_stat_chapters || 'Bölüm'}</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div className="stat-content">
                <span className="stat-number">{stats.users || 0}</span>
                <span className="stat-label">{appSettings.lang_stat_members || 'Üye'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Bug Report Modal — createPortal ile doğrudan body'ye mount edilir, her zaman ekran ortasında */}
      {showBugModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowBugModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
        >
          <div className="bug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bug-modal-header">
              <h3 className="bug-modal-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                </svg>
                Hata Bildir
              </h3>
              <button className="bug-modal-close" onClick={() => setShowBugModal(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleBugSubmit} className="bug-modal-form">
              {bugMessage && (
                <div className={`bug-modal-alert ${bugMessageType}`}>{bugMessage}</div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 7, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Başlık</label>
                <input
                  type="text"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="örn. Bölüm sayfaları yüklenmiyor"
                  required
                  style={{ width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', color: 'var(--text-primary, #fff)', fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', marginBottom: 7, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Açıklama / Detaylar</label>
                <textarea
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  placeholder="Yaşadığınız sorunu detaylıca açıklayın..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', color: 'var(--text-primary, #fff)', fontSize: '0.93rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s', lineHeight: 1.55 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.18s, color 0.18s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={bugSubmitting}
                  style={{ padding: '9px 20px', borderRadius: '10px', background: bugSubmitting ? 'rgba(239,68,68,0.5)' : '#ef4444', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: bugSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.18s, transform 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}
                  onMouseOver={e => { if (!bugSubmitting) e.currentTarget.style.background = '#dc2626'; }}
                  onMouseOut={e => { if (!bugSubmitting) e.currentTarget.style.background = '#ef4444'; }}
                >
                  {bugSubmitting ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
