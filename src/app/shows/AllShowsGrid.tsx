'use client';

import React, { useEffect } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { urlCdn } from './../../core/utils/cdn/cdn';
import { cn } from './../../core/utils/utils';
import Link from 'next/link';
import Image from 'next/image';

type EventDTO = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroPublicId?: string | null;
  description?: string | null;
  _count: { performances: number };
  performances: { startsAt: string }[];
};

type ApiResp = {
  items: EventDTO[];
  total: number;
  page: number;
  take: number;
  hasMore: boolean;
};

async function fetchPage(page = 0, take = 12, q?: string | null): Promise<ApiResp> {
  const u = new URL('/api/events', window.location.origin);
  u.searchParams.set('page', String(page));
  u.searchParams.set('take', String(take));
  if (q) u.searchParams.set('q', q);
  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar eventos');
  return res.json();
}

export default function AllShowsGrid({
  initial,
  autoLoadAll = false, // <— NOVO
}: {
  initial: ApiResp;
  autoLoadAll?: boolean;
}) {
  const [page, setPage] = useState(initial.page);
  const [items, setItems] = useState<EventDTO[]>(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const take = initial.take;

  const qKey = ['events', page, take] as const;
  const { isFetching, refetch } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const next = await fetchPage(page + 1, take);
      setPage(next.page);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
      return next;
    },
    enabled: false,
    staleTime: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        let keep = hasMore;
        while (!cancelled && keep) {
          const { data, error } = await refetch({ throwOnError: false });
          if (error) throw error;
          keep = Boolean(data?.hasMore);
        }
      } catch (err) {
        console.error('Falha ao auto-carregar shows', err);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refetch, hasMore]);

  return (
    <section aria-labelledby="all-shows-heading">
      <h1 id="all-shows-heading" className="mb-4 text-2xl font-semibold">
        Todos os Shows
      </h1>

      <div
        id="all-shows-grid"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {items.map((ev) => (
          <article
            role="listitem"
            key={ev.id}
            className="overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            <div className="relative h-44 w-full">
              <Image
                src={urlCdn(ev.heroPublicId ?? 'venue/placeholder', { w: 800 })}
                alt={ev.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>

            <div className="p-4">
              <h2 className="text-lg font-semibold">{ev.title}</h2>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {ev._count.performances > 1 ? 'Múltiplas datas' : 'Data única'}
                </p>

                <Link
                  href={`/event/${ev.slug}`}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!autoLoadAll && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-controls="all-shows-grid"
            className={cn(
              'rounded-full px-5 py-2 text-white',
              'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60',
            )}
          >
            {isFetching ? 'Carregando...' : 'Ver mais'}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum show encontrado.</p>
      )}
    </section>
  );
}
