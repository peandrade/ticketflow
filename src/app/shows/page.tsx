import AllShowsGrid from './AllShowsGrid';
import { listEvents } from '@/core/events';

export const dynamic = 'force-dynamic';

export default async function ShowsPage() {
  const srv = await listEvents({ page: 0, take: 48 });

  const initial = {
    items: srv.items.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      shortDescription: i.shortDescription,
      heroPublicId: i.heroPublicId ?? null,
      description: i.description ?? null,
      _count: { performances: i._count.performances },
      performances: i.performances.map((p) => ({
        startsAt:
          p.startsAt instanceof Date
            ? p.startsAt.toISOString()
            : new Date(p.startsAt as unknown as string).toISOString(),
      })),
    })),
    total: srv.total,
    page: srv.page,
    take: srv.take,
    hasMore: srv.hasMore,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <AllShowsGrid initial={initial} autoLoadAll />
    </div>
  );
}
