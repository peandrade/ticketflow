import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/features/components/ui/button';
import { CityEventCard } from '@/features/data';
import { cityToSlug, urlCdn } from '@/core/utils';
import React from 'react';

type Props = {
  city: string;
  state: string;
  items: CityEventCard[];
};

export default function CityShelf({ city, state, items }: Props) {
  const slug = cityToSlug(city, state);

  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Destaques | {city}</h2>
        <Link
          key={slug}
          href={`/cidades/${slug}`}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver mais
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((e) => (
          <Link key={e.id} href={`/event/${e.slug}`} className="rounded-lg text-sm font-medium">
            <article key={e.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="relative h-48 w-full">
                <Image
                  src={urlCdn(e.heroPublicId ?? 'placeholder', { w: 800 })}
                  alt={e.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex justify-between p-4">
                <h3 className="line-clamp-2 text-lg font-semibold">{e.title}</h3>
                <div className="mt-3 flex items-center justify-between"></div>
                <Button className="cursor-pointer">Confira</Button>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
