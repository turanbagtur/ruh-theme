import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
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
      description: 'Read manga online with AI-powered instant translation.',
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

export const metadata = {
  title: 'YomiTranslate — Read Manga Online with AI Translation',
  description: 'Read manga in any language with AI-powered instant translation. Explore thousands of manga series translated with cutting-edge AI technology. Free, fast, and always up-to-date.',
  keywords: 'manga, read manga online, manga translation, AI translation, yomitranslate, webtoon, manhwa, manhua, manga reader, online manga, free manga, manga chapters',
  manifest: '/manifest.json',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'YomiTranslate',
    title: 'YomiTranslate — Read Manga Online with AI Translation',
    description: 'Read manga in any language with AI-powered instant translation. Explore thousands of manga series translated with cutting-edge AI technology.',
    images: [{
      url: '/icon-512.png',
      width: 512,
      height: 512,
      alt: 'YomiTranslate Logo',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YomiTranslate — AI-Powered Manga Translation',
    description: 'Read manga in any language with instant AI translation.',
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
    title: 'YomiTranslate',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#dc2626',
};

function MaintenancePage({ message }) {
  const displayMessage = message || "We're currently performing scheduled maintenance to improve your experience. This won't take long — please check back shortly.";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Maintenance — YomiTranslate</title>
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
            Under Maintenance
          </div>
          <div className="icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1>We&apos;ll be back soon</h1>
          <p>{displayMessage}</p>
          <div className="divider" />
          <div className="contact">
            Questions? Contact us at{' '}
            <a href="mailto:yomiitranslate@gmail.com">yomiitranslate@gmail.com</a>
          </div>
          <a href="/login" className="login-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Admin Login
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

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname') || '/';
  const maintenance = isMaintenanceModeOn();
  const isAdmin = isAdminFromCookie(cookieStore);

  // Allow login page and all API routes through maintenance mode (admin needs to log in)
  const isBypassed = MAINTENANCE_BYPASS.some(p => pathname.startsWith(p));

  // Show maintenance page to non-admins when maintenance mode is on
  if (maintenance && !isAdmin && !isBypassed) {
    const msg = getMaintenanceMessage();
    return <MaintenancePage message={msg} />;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
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
              🔧 Maintenance mode is <strong>ON</strong> — Only you can see the site. Visitors see the maintenance page.
            </div>
          )}
          <main>{children}</main>
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-left">
                <span className="logo-icon">読</span>
                <span>YomiTranslate</span>
              </div>
              <div className="footer-links">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms &amp; Conditions</Link>
                <Link href="/series">Browse</Link>
              </div>
              <div className="footer-right">
                © 2026 YomiTranslate.
              </div>
            </div>
            <div className="footer-disclaimer">
              YomiTranslate is a fan-driven platform. All manga titles, artwork, and characters belong to their respective creators and publishers.
              Content is provided for educational and entertainment purposes only. If you are a copyright holder and believe your work has been used without permission,
              please contact us at <a href="mailto:yomiitranslate@gmail.com" style={{color: 'var(--primary)'}}>yomiitranslate@gmail.com</a> for prompt removal.
            </div>
          </footer>
        </AuthProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }`}
        </Script>
      </body>
    </html>
  );
}
