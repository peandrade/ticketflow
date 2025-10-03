import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';
import { VenueCardType } from '@/features/data';

export function VenueCard({ v }: { v: VenueCardType }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="relative h-44 w-full">
        <Image
          src={urlCdn(v.coverPublicId ?? 'venue/placeholder', { w: 800 })}
          alt={v.name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{v.name}</h3>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {v.city} • {v.state}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <Link
            href={`/casas/${v.slug}`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Ver detalhes
          </Link>
          <span className="text-sm text-neutral-500">{v.upcomingCount} próximo(s)</span>
        </div>
      </div>
    </article>
  );
}
