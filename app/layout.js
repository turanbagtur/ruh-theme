import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { SettingsProvider } from '@/components/SettingsProvider';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Script from 'next/script';
import { cookies, headers } from 'next/headers';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Paths that bypass maintenance mode (so admin can log in)
const MAINTENANCE_BYPASS = ['/login', '/api/'];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'YomiTranslate',
      description: 'Yapay zeka destekli anında çeviri ile çevrimiçi manga okuyun.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/series?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'YomiTranslate',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon-512.png`,
        width: 512,
        height: 512,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'yomiitranslate@gmail.com',
      },
    },
  ],
});

export async function generateMetadata() {
  const settings = getSiteSettings();
  const siteName = settings.site_name || 'YomiTranslate';
  const siteTitle = settings.seo_title_home || 'YomiTranslate — Yapay Zeka Çevirili Çevrimiçi Manga Oku';
  const siteDesc = settings.seo_desc_home || 'Yapay zeka destekli anında çeviri ile mangaları istediğiniz dilde okuyun. En son yapay zeka teknolojisi ile çevrilmiş binlerce manga serisini keşfedin. Ücretsiz, hızlı ve her zaman güncel.';

  return {
    title: siteTitle,
    description: siteDesc,
    keywords: 'manga, çevrimiçi manga oku, manga okuma, manga çevirisi, yapay zeka çevirisi, yomitranslate, webtoon, manhwa, manhua, Türkçe manga',
    manifest: '/manifest.json',
    metadataBase: new URL(BASE_URL),
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url: '/',
      siteName: siteName,
      title: siteTitle,
      description: siteDesc,
      images: [{
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: `${siteName} Logo`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDesc,
      images: ['/icon-512.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: siteName,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#5e72e4',
};

function MaintenancePage({ message }) {
  const displayMessage = message || "Deneyiminizi iyileştirmek için şu anda planlı bakım çalışması yapıyoruz. Bu işlem uzun sürmeyecektir — lütfen kısa süre sonra tekrar kontrol edin.";
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bakım Modu — YomiTranslate</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #0f0f14;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: #1a1a2e;
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 0 40px rgba(99,102,241,0.08);
          }
          .logo { font-size: 3rem; margin-bottom: 12px; }
          .brand { font-size: 1.4rem; font-weight: 700; color: #a5b4fc; margin-bottom: 28px; }
          .icon-wrapper {
            width: 72px; height: 72px; margin: 0 auto 20px;
            background: rgba(99,102,241,0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            animation: iconPulse 2s ease-in-out infinite;
          }
          .icon-wrapper svg { color: #818cf8; }
          h1 { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; margin-bottom: 28px; }
          .divider { height: 1px; background: rgba(99,102,241,0.15); margin: 24px 0; }
          .contact { font-size: 0.82rem; color: #64748b; }
          .contact a { color: #818cf8; text-decoration: none; }
          .badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 50px; padding: 6px 16px;
            font-size: 0.8rem; color: #a5b4fc; margin-bottom: 28px;
          }
          .dot {
            width: 8px; height: 8px; background: #f59e0b;
            border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;
          }
          .login-link {
            display: inline-flex; align-items: center; gap: 6px;
            color: #64748b; font-size: 0.78rem; margin-top: 16px;
            text-decoration: none; transition: color 0.2s;
          }
          .login-link:hover { color: #a5b4fc; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes iconPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="logo">読</div>
          <div className="brand">YomiTranslate</div>
          <div className="badge">
            <span className="dot" />
            Bakım Çalışması
          </div>
          <div className="icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1>Yakında döneceğiz</h1>
          <p>{displayMessage}</p>
          <div className="divider" />
          <div className="contact">
            Sorularınız mı var? Bize e-posta gönderin:{' '}
            <a href="mailto:yomiitranslate@gmail.com">yomiitranslate@gmail.com</a>
          </div>
          <a href="/login" className="login-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Yönetici Girişi
          </a>
        </div>
      </body>
    </html>
  );
}

function isAdminFromCookie(cookieStore) {
  try {
    const token = cookieStore.get('yomi_token')?.value;
    if (!token) return false;
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = jwt.verify(token, secret);
    return payload?.role === 'admin';
  } catch {
    return false;
  }
}

function isMaintenanceModeOn() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'maintenance_mode'").get();
    return row?.setting_value === '1';
  } catch {
    return false;
  }
}

function getMaintenanceMessage() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'maintenance_message'").get();
    return row?.setting_value || '';
  } catch {
    return '';
  }
}

const DEFAULT_NAVBAR_MENU = [
  { label: 'Ana Sayfa', url: '/' },
  { label: 'Göz At', url: '/series' },
  { label: 'Sıralama', url: '/ranking' },
  { label: 'İstekler', url: '/requests' },
];

const DEFAULT_FOOTER_MENU = [
  { label: 'Gizlilik Politikası', url: '/privacy' },
  { label: 'Kullanım Koşulları', url: '/terms' },
  { label: 'Göz At', url: '/series' },
];

function getSiteSettings() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all();
    const s = {};
    rows.forEach(r => { s[r.setting_key] = r.setting_value; });

    let navbarMenu = DEFAULT_NAVBAR_MENU;
    let footerMenu = DEFAULT_FOOTER_MENU;
    try { if (s.navbar_menu) navbarMenu = JSON.parse(s.navbar_menu); } catch {}
    try { if (s.footer_menu) footerMenu = JSON.parse(s.footer_menu); } catch {}

    // Merge custom pages into navbar/footer menus
    try {
      const customPages = db.prepare(
        "SELECT title, slug, show_in_navbar, show_in_footer FROM custom_pages WHERE is_active = 1 AND (show_in_navbar = 1 OR show_in_footer = 1)"
      ).all();
      for (const page of customPages) {
        const pageEntry = { label: page.title, url: `/p/${page.slug}` };
        if (page.show_in_navbar) {
          const alreadyInNavbar = navbarMenu.some(item => item.url === pageEntry.url);
          if (!alreadyInNavbar) navbarMenu = [...navbarMenu, pageEntry];
        }
        if (page.show_in_footer) {
          const alreadyInFooter = footerMenu.some(item => item.url === pageEntry.url);
          if (!alreadyInFooter) footerMenu = [...footerMenu, pageEntry];
        }
      }
    } catch {}

    return {
      site_name: s.site_name || '',
      site_description: s.site_description || '',
      accent_color: s.accent_color || '',
      button_color: s.button_color || '',
      button_hover_color: s.button_hover_color || '',
      button_text_color: s.button_text_color || '',
      link_color: s.link_color || '',
      link_hover_color: s.link_hover_color || '',
      navbar_bg_color: s.navbar_bg_color || '',
      favicon_url: s.favicon_url || '',
      logo_url: s.logo_url || '',
      footer_text: s.footer_text || '',
      contact_email: s.contact_email || '',
      discord_url: s.discord_url || '',
      reddit_url: s.reddit_url || '',
      twitter_url: s.twitter_url || '',
      instagram_url: s.instagram_url || '',
      tiktok_url: s.tiktok_url || '',
      youtube_url: s.youtube_url || '',
      facebook_url: s.facebook_url || '',
      custom_css: s.custom_css || '',
      reader_bg_color: s.reader_bg_color || '',
      announcement_bg_color: s.announcement_bg_color || '',
      seo_title_home: s.seo_title_home || '',
      seo_desc_home: s.seo_desc_home || '',
      seo_title_series: s.seo_title_series || '',
      seo_title_chapter: s.seo_title_chapter || '',
      navbar_menu: navbarMenu,
      footer_menu: footerMenu,
    };
  } catch {
    return {
      navbar_menu: DEFAULT_NAVBAR_MENU,
      footer_menu: DEFAULT_FOOTER_MENU,
    };
  }
}

// Lightens/darkens a hex color for derived CSS variables
function hexToHsl(hex) {
  try {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const r = parseInt(h.slice(0,2),16)/255;
    const g = parseInt(h.slice(2,4),16)/255;
    const b = parseInt(h.slice(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let hue, sat, lit;
    lit = (max + min) / 2;
    if (max === min) { hue = sat = 0; }
    else {
      const d = max - min;
      sat = lit > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
        case r: hue = ((g - b)/d + (g < b ? 6 : 0)) / 6; break;
        case g: hue = ((b - r)/d + 2) / 6; break;
        default: hue = ((r - g)/d + 4) / 6; break;
      }
    }
    return [Math.round(hue*360), Math.round(sat*100), Math.round(lit*100)];
  } catch { return null; }
}

function buildDynamicCss(settings) {
  const lines = [];

  // Accent color → derive all related vars
  if (settings.accent_color && settings.accent_color.startsWith('#')) {
    const hsl = hexToHsl(settings.accent_color);
    if (hsl) {
      const [h, s, l] = hsl;
      const dark = `hsl(${h}, ${s}%, ${Math.max(0, l - 10)}%)`;
      const darker = `hsl(${h}, ${s}%, ${Math.max(0, l - 18)}%)`;
      const light = `hsl(${h}, ${s}%, ${Math.min(100, l + 15)}%)`;
      const bright = `hsl(${h}, ${s}%, ${Math.min(100, l + 22)}%)`;
      const glow = `hsla(${h}, ${s}%, ${l}%, 0.35)`;
      const subtle = `hsla(${h}, ${s}%, ${l}%, 0.12)`;
      const subtle2 = `hsla(${h}, ${s}%, ${l}%, 0.08)`;
      const gradient = `linear-gradient(135deg, ${darker}, ${settings.accent_color}, ${dark})`;
      lines.push(
        `  --primary: ${settings.accent_color};`,
        `  --primary-dark: ${dark};`,
        `  --primary-light: ${light};`,
        `  --accent: ${settings.accent_color};`,
        `  --accent-light: ${light};`,
        `  --accent-bright: ${bright};`,
        `  --primary-glow: ${glow};`,
        `  --primary-subtle: ${subtle};`,
        `  --gradient-primary: ${gradient};`,
      );
    }
  }

  // Button color
  if (settings.button_color) lines.push(`  --btn-primary-bg: ${settings.button_color};`);
  // Button hover color
  if (settings.button_hover_color) lines.push(`  --btn-primary-hover: ${settings.button_hover_color};`);
  // Button text color
  if (settings.button_text_color) lines.push(`  --btn-primary-text: ${settings.button_text_color};`);
  // Link color
  if (settings.link_color) lines.push(`  --link-color: ${settings.link_color};`);
  // Link hover color
  if (settings.link_hover_color) lines.push(`  --link-hover-color: ${settings.link_hover_color};`);
  // Navbar background
  if (settings.navbar_bg_color) lines.push(`  --navbar-bg: ${settings.navbar_bg_color};`);
  // Reader background
  if (settings.reader_bg_color) lines.push(`  --reader-bg: ${settings.reader_bg_color};`);
  // Announcement bar color
  if (settings.announcement_bg_color) lines.push(`  --announcement-bg: ${settings.announcement_bg_color};`);

  let css = '';
  if (lines.length > 0) css += `:root {\n${lines.join('\n')}\n}\n`;

  // Apply comprehensive overrides so the accent color reaches all themed elements
  const overrides = [];

  if (settings.accent_color) {
    const ac = settings.accent_color;
    // Buttons
    overrides.push(
      `.btn-primary { background: var(--primary) !important; border-color: var(--primary) !important; }`,
      `.btn-primary:hover { background: var(--primary-dark) !important; border-color: var(--primary-dark) !important; }`,
    );
    // Hero slider elements
    overrides.push(
      `.hero-meta-badge { border-color: var(--primary) !important; }`,
      `.hero-dot.active { background: var(--primary) !important; }`,
      `.hero-genre-tag { background: var(--primary-subtle) !important; border-color: var(--primary) !important; color: var(--accent-bright) !important; }`,
    );
    // Accent-colored text & borders
    overrides.push(
      `.section-title svg { stroke: var(--primary) !important; }`,
      `.genre-tag, .genre-tag-filter.active { background: var(--primary-subtle) !important; border-color: var(--primary) !important; color: var(--accent-light) !important; }`,
      `.genre-tag-filter.active { background: var(--primary) !important; color: #fff !important; }`,
    );
    // Stats bar
    overrides.push(
      `.stats-bar { background: linear-gradient(135deg, var(--bg-card), var(--primary-subtle)) !important; border-top-color: var(--primary) !important; }`,
      `.stat-number { color: var(--primary) !important; }`,
    );
    // Series card & chapter links
    overrides.push(
      `.asura-title:hover, .tc-title { color: var(--accent-light) !important; }`,
      `.asura-chapter-row:hover { color: var(--accent-light) !important; border-left-color: var(--primary) !important; }`,
    );
    // Most Read widget tabs
    overrides.push(
      `.mr3-tab.active { background: var(--primary) !important; color: #fff !important; }`,
      `.mr3-badge-1 { background: var(--primary) !important; }`,
    );
    // Navbar active/hover
    overrides.push(
      `.nav-link.active, .nav-link:hover { color: var(--primary) !important; }`,
      `.nav-link.active::after { background: var(--primary) !important; }`,
    );
    // Announcement bar
    overrides.push(
      `.ann-badge { color: var(--primary) !important; }`,
    );
    // Sidebar widget headers
    overrides.push(
      `.widget-header h3 { color: var(--accent-light) !important; }`,
      `.epw-read-btn { color: var(--accent-light) !important; }`,
    );
    // Filter bar active
    overrides.push(
      `.filter-bar select:focus, .filter-bar input:focus { border-color: var(--primary) !important; }`,
    );
    // Rankings / profile
    overrides.push(
      `.rank-badge { background: var(--primary) !important; }`,
      `.yomi-points { color: var(--primary) !important; }`,
    );
    // Trending card rank numbers
    overrides.push(
      `.tc-number.rank-1, .tc-number.rank-2, .tc-number.rank-3 { color: var(--primary) !important; -webkit-text-stroke-color: var(--primary-dark) !important; }`,
    );
    // Comment section
    overrides.push(
      `.comment-action:hover, .comment-action.active { color: var(--primary) !important; }`,
    );
    // Continue reading card
    overrides.push(
      `.continue-reading-card { border-left-color: var(--primary) !important; }`,
      `.cr-subtitle { color: var(--primary) !important; }`,
    );
    // Footer
    overrides.push(
      `.footer a:hover { color: var(--primary) !important; }`,
      `.footer-social-link:hover { background: var(--primary-subtle) !important; color: var(--primary) !important; }`,
    );
    // Series detail
    overrides.push(
      `.series-status-badge { background: var(--primary-subtle) !important; color: var(--primary) !important; border-color: var(--primary) !important; }`,
      `.chapter-item:hover { border-left-color: var(--primary) !important; }`,
    );
    // Search results
    overrides.push(
      `.search-result-item:hover { background: var(--primary-subtle) !important; }`,
    );
    // Progress/loading bar
    overrides.push(
      `.spinner { border-top-color: var(--primary) !important; }`,
    );
  }

  if (settings.button_color) overrides.push(`.btn-primary { background: var(--btn-primary-bg) !important; border-color: var(--btn-primary-bg) !important; }`);
  if (settings.button_hover_color) overrides.push(`.btn-primary:hover { background: var(--btn-primary-hover) !important; border-color: var(--btn-primary-hover) !important; }`);
  if (settings.button_text_color) overrides.push(`.btn-primary, .btn-primary:hover { color: var(--btn-primary-text) !important; }`);
  if (settings.link_color) overrides.push(`a { color: var(--link-color); }`);
  if (settings.link_hover_color) overrides.push(`a:hover { color: var(--link-hover-color) !important; }`);
  if (settings.navbar_bg_color) overrides.push(`.navbar { background: var(--navbar-bg) !important; backdrop-filter: none !important; }`);
  if (settings.announcement_bg_color) overrides.push(`.announcements-bar, .ann-item { background: var(--announcement-bg) !important; }`);

  if (overrides.length > 0) css += overrides.join('\n') + '\n';

  // Custom CSS (always last so it can override everything)
  if (settings.custom_css) css += '\n' + settings.custom_css;

  return css;
}

// Social link SVG icons
function SocialLinks({ settings }) {
  const socials = [
    { key: 'discord_url', label: 'Discord', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.033.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> },
    { key: 'reddit_url', label: 'Reddit', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg> },
    { key: 'twitter_url', label: 'Twitter / X', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: 'instagram_url', label: 'Instagram', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
    { key: 'tiktok_url', label: 'TikTok', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z"/></svg> },
    { key: 'youtube_url', label: 'YouTube', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    { key: 'facebook_url', label: 'Facebook', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  ];

  const activeLinks = socials.filter(s => settings[s.key]);
  if (activeLinks.length === 0) return null;

  return (
    <div className="footer-social">
      {activeLinks.map(s => (
        <a key={s.key} href={settings[s.key]} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="footer-social-link">
          {s.svg}
        </a>
      ))}
    </div>
  );
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname') || '/';
  const maintenance = isMaintenanceModeOn();
  const isAdmin = isAdminFromCookie(cookieStore);
  const siteSettings = getSiteSettings();

  // Allow login page and all API routes through maintenance mode (admin needs to log in)
  const isBypassed = MAINTENANCE_BYPASS.some(p => pathname.startsWith(p));

  // Show maintenance page to non-admins when maintenance mode is on
  if (maintenance && !isAdmin && !isBypassed) {
    const msg = getMaintenanceMessage();
    return <MaintenancePage message={msg} />;
  }

  const dynamicCss = buildDynamicCss(siteSettings);

  const displaySiteName = siteSettings.site_name || 'YomiTranslate';
  const displayFooterText = siteSettings.footer_text || `© ${new Date().getFullYear()} ${displaySiteName}.`;
  const contactEmail = siteSettings.contact_email || 'yomiitranslate@gmail.com';

  return (
    <html lang="tr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {siteSettings.favicon_url && (
          <link rel="icon" href={siteSettings.favicon_url} />
        )}
        {dynamicCss && (
          <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
      </head>
      <body suppressHydrationWarning>
        <SettingsProvider>
        <AuthProvider>
          <Navbar siteSettings={siteSettings} />
          {maintenance && isAdmin && (
            <div style={{
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 0,
              padding: '8px 20px',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#fbbf24',
              letterSpacing: '0.02em',
            }}>
              🔧 Bakım modu <strong>AÇIK</strong> — Siteyi sadece siz görebilirsiniz. Ziyaretçiler bakım sayfasını görür.
            </div>
          )}
          <main>{children}</main>
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-left">
                {siteSettings.logo_url ? (
                  <img src={siteSettings.logo_url} alt={displaySiteName} style={{ maxHeight: 32, maxWidth: 140, objectFit: 'contain' }} />
                ) : (
                  <>
                    <span className="logo-icon">読</span>
                    <span>{displaySiteName}</span>
                  </>
                )}
              </div>
              <div className="footer-links">
                {(siteSettings.footer_menu || DEFAULT_FOOTER_MENU).map((item, i) => (
                  <Link key={i} href={item.url || '#'}>{item.label}</Link>
                ))}
              </div>
              <div className="footer-right">
                {displayFooterText}
              </div>
            </div>
            <SocialLinks settings={siteSettings} />
            <div className="footer-disclaimer">
              {displaySiteName} hayran odaklı bir platformdur. Tüm manga başlıkları, çizimler ve karakterler kendi yaratıcılarına ve yayıncılarına aittir.
              İçerikler yalnızca eğitim ve eğlence amaçlı sunulmaktadır. Telif hakkı sahibiyseniz ve çalışmanızın izinsiz kullanıldığını düşünüyorsanız,
              yayından kaldırılması için lütfen <a href={`mailto:${contactEmail}`} style={{color: 'var(--primary)'}}>{contactEmail}</a> adresinden bizimle iletişime geçin.
            </div>
          </footer>
        </AuthProvider>
        </SettingsProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
              if (isLocal) {
                navigator.serviceWorker.getRegistrations()
                  .then(regs => Promise.all(regs.map(reg => reg.unregister())))
                  .catch(() => {});
                if ('caches' in window) {
                  caches.keys()
                    .then(keys => Promise.all(keys.map(key => caches.delete(key))))
                    .catch(() => {});
                }
              } else {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
