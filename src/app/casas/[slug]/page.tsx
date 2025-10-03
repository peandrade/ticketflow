import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';
import { notFound } from 'next/navigation';
import { getVenueBySlug } from '@/features/data';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 pb-10 md:px-6">
      <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl">
        <Image
          src={urlCdn(venue.coverPublicId ?? 'venue/placeholder', { w: 1600 })}
          alt={venue.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold">{venue.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {venue.city} • {venue.state}
        </p>
        {venue.address && <p className="text-muted-foreground text-sm">{venue.address}</p>}
        {venue.capacity && (
          <p className="text-muted-foreground text-sm">
            Capacidade: {venue.capacity.toLocaleString('pt-BR')}
          </p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Próximos eventos</h2>

        {venue.upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum evento futuro nesta casa.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venue.upcoming.map((p) => (
              <article
                key={p.perfId}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={urlCdn(p.event.heroPublicId ?? 'event/placeholder', { w: 800 })}
                    alt={p.event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-lg font-semibold">{p.event.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {new Date(p.startsAt).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link
                      key={p.event.slug}
                      href={`/event/${p.event.slug}`}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Ver ingressos
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
