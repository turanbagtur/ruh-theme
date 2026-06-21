'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Bakım modunu her route değişiminde kontrol eder.
// Server-side layout.js yalnızca ilk yüklemede çalışır;
// bu bileşen Next.js SPA navigasyonu sırasında bakım modunu yakalar.
export default function MaintenanceChecker() {
    const pathname = usePathname();
    const router = useRouter();
    const lastCheck = useRef(0);

    useEffect(() => {
        // Admin, login, maintenance ve API yollarını atla
        if (!pathname) return;
        if (
            pathname.startsWith('/admin') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/maintenance')
        ) return;

        // Aynı yolda çok sık kontrol etme (en az 5 saniye aralık)
        const now = Date.now();
        if (now - lastCheck.current < 5000) return;
        lastCheck.current = now;

        fetch('/api/maintenance-status', { cache: 'no-store' })
            .then(r => r.json())
            .then(async data => {
                if (data.maintenance) {
                    // Admin kullanıcılar bakım modunda da siteye erişebilir
                    try {
                        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
                        if (meRes.ok) {
                            const meData = await meRes.json();
                            if (meData?.user?.role === 'admin') return;
                        }
                    } catch {}
                    window.location.href = '/maintenance';
                }
            })
            .catch(() => {});
    }, [pathname]);

    return null;
}