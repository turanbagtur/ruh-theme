const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

export const metadata = {
    title: 'Manga Keşfet — Tüm Seriler | YomiTranslate',
    description: 'Binlerce manga, manhwa ve manhua serisine göz atın. Tür, durum ve tipe göre filtreleyin. Yapay zeka destekli anında çeviri ile Türkçe manga okuma deneyimini ücretsiz yaşayın.',
    keywords: 'manga keşfet, manga listesi, manga oku, ücretsiz manga oku, manhwa, manhua, aksiyon mangası, romantik manga, fantastik manga, yomitranslate',
    alternates: {
        canonical: `${BASE_URL}/series`,
    },
    openGraph: {
        type: 'website',
        url: `${BASE_URL}/series`,
        siteName: 'YomiTranslate',
        title: 'Manga Keşfet — Tüm Seriler | YomiTranslate',
        description: 'Binlerce manga, manhwa ve manhua serisine göz atın. Yapay zeka destekli Türkçe çeviri ile ücretsiz manga okuyun.',
        images: [{
            url: `${BASE_URL}/icon-512.png`,
            width: 512,
            height: 512,
            alt: 'YomiTranslate — Manga Keşfet',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Manga Keşfet | YomiTranslate',
        description: 'Binlerce manga, manhwa ve manhua serisine göz atın. Yapay zeka destekli Türkçe çeviri ile ücretsiz manga okuyun.',
        images: [`${BASE_URL}/icon-512.png`],
    },
};

// Madde 5: CollectionPage JSON-LD schema
const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${BASE_URL}/series#collection`,
    name: 'Manga Keşfet - Tüm Seriler',
    description: 'Yapay zeka destekli anında çeviri ile binlerce manga, manhwa ve manhua serisini ücretsiz okuyun.',
    url: `${BASE_URL}/series`,
    isPartOf: {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: 'YomiTranslate',
        url: BASE_URL,
    },
    breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Ana Sayfa',
                item: BASE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Manga Keşfet',
                item: `${BASE_URL}/series`,
            },
        ],
    },
};

export default function SeriesListLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
            />
            {children}
        </>
    );
}