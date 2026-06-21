'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SettingsContext = createContext(null);

// Paths that don't need the maintenance redirect
const MAINTENANCE_BYPASS = ['/login', '/maintenance', '/api/'];

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();
    const intervalRef = useRef(null);

    const fetchSettings = useCallback(async (checkMaintenance = false) => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.settings) {
                    setSettings(data.settings);

                    // Bakım modu client-side kontrolü
                    if (checkMaintenance && data.settings.maintenance_mode === '1') {
                        const isBypassed = MAINTENANCE_BYPASS.some(p => pathname?.startsWith(p));
                        if (!isBypassed) {
                            // JWT token'dan admin kontrolü (cookie okuma yerine /api/auth/me kullan)
                            try {
                                const meRes = await fetch('/api/auth/me');
                                const meData = await meRes.json();
                                const isAdmin = meData?.user?.role === 'admin';
                                if (!isAdmin) {
                                    window.location.href = '/maintenance';
                                }
                            } catch {
                                // Auth kontrolü başarısız olursa yönlendirme yapma
                            }
                        }
                    }
                }
            }
        } catch {
            // Network error — keep previous settings
        } finally {
            setLoaded(true);
        }
    }, [pathname]);

    // İlk yüklemede ayarları çek (bakım modu layout.js tarafından zaten kontrol edildi)
    useEffect(() => {
        fetchSettings(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Pathname (client-side navigation) değiştiğinde bakım modunu kontrol et
    useEffect(() => {
        if (loaded) {
            fetchSettings(true);
        }
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Her 30 saniyede bir bakım modu kontrolü
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            fetchSettings(true);
        }, 30000);
        return () => clearInterval(intervalRef.current);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <SettingsContext.Provider value={{ settings, loaded, refetch: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);