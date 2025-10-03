'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';
import { Event } from '@/types/event';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export const HeroCarousel = ({ event }: { event: Event[] }) => {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = useState(0);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => autoplay.current.stop()}
      onMouseLeave={() => autoplay.current.play()}
    >
      <div className="relative" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {event.map((e, idx) => (
            <div key={e.id} className="group relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[38vh] md:h-[46vh] lg:h-[54vh]">
                <Image
                  className="object-cover"
                  src={urlCdn(e.heroPublicId!, { w: 1920 })}
                  alt={e.title}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                />
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 z-20 transition-colors duration-300 group-hover:bg-blue-600/25 " />
                <div className="absolute inset-0 z-30 flex items-end">
                  <div className="max-w-xl p-6 opacity-0 transition-opacity group-hover:opacity-100 md:p-12">
                    <h2 className="text-2xl font-bold text-white md:text-4xl">{e.title}</h2>

                    {!!e.title && <p className="mt-2 line-clamp-2 text-white/80">{e.shortDescription}</p>}

                    <div className="mt-4">
                      <Link
                        key={e.slug}
                        href={`/event/${e.slug}`}
                        className="inline-flex items-center rounded-xl bg-white px-5 py-2 font-medium text-gray-900 shadow transition hover:shadow-lg"
                      >
                        Comprar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        aria-label="Anterior"
        className="absolute top-1/2 left-3 z-40 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-transparent text-white cursor-pointer"
        onClick={() => emblaApi?.scrollPrev()}
      >
        <span className="sr-only cursor-pointer">Anterior</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        aria-label="Próximo"
        className="absolute top-1/2 right-3 z-40 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-transparent text-white cursor-pointer"
        onClick={() => emblaApi?.scrollNext()}
      >
        <span className="sr-only cursor-pointer">Próximo</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        </svg>
      </button>
      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
        {event.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full ${
              selected === i ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
            } transition`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
