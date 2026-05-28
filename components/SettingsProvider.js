'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});
    const [loaded, setLoaded] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.settings) {
                    setSettings(data.settings);
                }
            }
        } catch {
            // Network error — keep previous settings
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loaded, refetch: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);