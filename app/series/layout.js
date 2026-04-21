const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

export const metadata = {
    title: 'Browse Manga — All Series | YomiTranslate',
    description: 'Browse thousands of manga, manhwa and manhua series. Filter by genre, status, and type. Read online for free with AI-powered instant translation.',
    keywords: 'browse manga, manga list, manga online, read manga free, manhwa, manhua, action manga, romance manga, fantasy manga, yomitranslate',
    alternates: {
        canonical: `${BASE_URL}/series`,
    },
    openGraph: {
        type: 'website',
        url: `${BASE_URL}/series`,
        siteName: 'YomiTranslate',
        title: 'Browse Manga — All Series | YomiTranslate',
        description: 'Browse thousands of manga, manhwa and manhua series with AI translation. Filter by genre, status, and more.',
        images: [{
            url: `${BASE_URL}/icon-512.png`,
            width: 512,
            height: 512,
            alt: 'YomiTranslate — Browse Manga',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Browse Manga | YomiTranslate',
        description: 'Browse thousands of manga, manhwa and manhua series with AI translation.',
        images: [`${BASE_URL}/icon-512.png`],
    },
};

// Madde 5: CollectionPage JSON-LD schema
const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${BASE_URL}/series#collection`,
    name: 'Browse Manga Series',
    description: 'Browse thousands of manga, manhwa and manhua series with AI-powered instant translation.',
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
                name: 'Home',
                item: BASE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Browse',
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