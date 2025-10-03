import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';
import { Event } from '@/types/event';
import { Button } from '../../ui/button';

export const EventCard = ({ event }: { event: Event }) => {
  return (
    <article className="h-full">
      <Link
        key={event.slug}
        href={`/event/${event.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-xl border"
      >
        <div className="relative aspect-[8/3]">
          <Image
            src={urlCdn(event.heroPublicId!, { w: 800 })}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 800px"
            priority={false}
          />
        </div>

        <div className="mt-auto flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3
              className="font-semibold leading-snug"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.title}
            </h3>
            <p className="text-sm text-neutral-600">Múltiplas datas</p>
          </div>
          <Button className="shrink-0">Confira</Button>
        </div>
      </Link>
    </article>
  );
};
