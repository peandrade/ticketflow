import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { parseCitySlug, urlCdn } from '@/core/utils';
import { Button } from '@/features/components/ui/button';
import { getCityEvents, resolveCityBySlug } from '@/features/data';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseCitySlug(slug);
  if (!parsed) return notFound();

  const realCity = await resolveCityBySlug(parsed.citySlug, parsed.state);
  if (!realCity) return notFound();

  const items = await getCityEvents({ city: realCity, state: parsed.state, take: 200 });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">
          Eventos em {realCity} ({parsed.state})
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {items.length
            ? `${items.length} evento${items.length > 1 ? 's' : ''} encontrados`
            : 'Nenhum evento futuro encontrado.'}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <Link
            key={e.slug}
            href={`/event/${e.slug}`}
            className="rounded-lg font-medium"
          >
            <article key={e.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="relative h-48 w-full">
                <Image
                  src={urlCdn(e.heroPublicId ?? 'placeholder', { w: 800 })}
                  alt={e.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="p-4 flex justify-between">
                <h2 className="line-clamp-2 text-lg font-semibold">{e.title}</h2>
                <Button className='cursor-pointer'>Ver mais</Button>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
