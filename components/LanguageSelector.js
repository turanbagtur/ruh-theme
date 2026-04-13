'use client';
import { useState, useEffect } from 'react';

const LANGUAGES = [
    // European
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'bg', name: 'Български', flag: '🇧🇬' },
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
    { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'no', name: 'Norsk', flag: '🇳🇴' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    // Middle East / Africa
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    // Asia
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文(简)', flag: '🇨🇳' },
    { code: 'zt', name: '中文(繁)', flag: '🇹🇼' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
];

export default function LanguageSelector({ selectedLang, onSelect, disabled }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const current = LANGUAGES.find(l => l.code === selectedLang);

    const filtered = search.trim()
        ? LANGUAGES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.includes(search.toLowerCase()))
        : LANGUAGES;

    const [dropRight, setDropRight] = useState(false);

    useEffect(() => {
        function handleClickOutside(e) {
            if (!e.target.closest('.language-selector')) setOpen(false);
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    function handleOpen(e) {
        if (disabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // If the dropdown would overflow the right side of the viewport, anchor it to the right
        setDropRight(rect.left + 230 > window.innerWidth - 16);
        setOpen(!open);
        if (open) setSearch('');
    }

    return (
        <div className="language-selector">
            <button
                className={`lang-btn ${open ? 'active' : ''}`}
                onClick={handleOpen}
                disabled={disabled}
                style={{ maxWidth: 160, overflow: 'hidden' }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {current ? `${current.flag} ${current.name}` : 'Original'}
                </span>
                <svg width="12" height="12" className={`chevron ${open ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6" /></svg>
            </button>

            {open && (
                <div className="lang-dropdown" style={dropRight ? { left: 'auto', right: 0 } : {}}>
                    <div className="lang-dropdown-header">Translate to</div>
                    <div style={{ padding: '6px 10px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search language..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            style={{ padding: '6px 10px', fontSize: '0.82rem', height: 32 }}
                        />
                    </div>
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                        {!search && (
                            <button
                                className={`lang-option ${!selectedLang ? 'selected' : ''}`}
                                onClick={() => { onSelect(''); setOpen(false); }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                Original
                            </button>
                        )}
                        {filtered.map(lang => (
                            <button
                                key={lang.code}
                                className={`lang-option ${selectedLang === lang.code ? 'selected' : ''}`}
                                onClick={() => { onSelect(lang.code); setOpen(false); setSearch(''); }}
                            >
                                <span>{lang.flag}</span>
                                {lang.name}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                No languages found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
