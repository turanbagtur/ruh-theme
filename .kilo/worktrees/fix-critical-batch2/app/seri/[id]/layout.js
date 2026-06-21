import { getDb } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

// Canonical URL'yi /series/[slug] olarak işaret et — /seri/[id] duplicate content sorununu önler
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const db = getDb();
    const isNumeric = /^\d+$/.test(id);
    const series = isNumeric
      ? db.prepare('SELECT slug, id FROM series WHERE id = ? AND published = 1').get(id)
      : db.prepare('SELECT slug, id FROM series WHERE slug = ? AND published = 1').get(id);

    if (!series) return {};

    const slug = series.slug || series.id;
    return {
      alternates: {
        canonical: `${BASE_URL}/series/${slug}`,
      },
    };
  } catch {
    return {};
  }
}

export default function SeriLayout({ children }) {
  return children;
}