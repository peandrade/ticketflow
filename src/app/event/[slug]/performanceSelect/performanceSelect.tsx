'use client';

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PerformanceOption } from '@/types/event';

type Props = {
  eventTitle: string;
  options: PerformanceOption[];
  value?: string;
  onChange: (id: string) => void;
};

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function PerformanceSelect({ eventTitle, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-w-0 rounded-md bg-white px-3 py-3 text-left shadow-sm
                   outline-none ring-offset-2 focus:ring-2 focus:ring-white"
      >
        <div className="truncate">
          {selected ? (
            <>
              <span className="font-medium break-words">
                {eventTitle} | {selected.venue.city}
              </span>
              <span className="ml-1 text-xs text-gray-600">
                - {formatDate(selected.startsAt)} às {formatTime(selected.startsAt)}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Selecione a data</span>
          )}
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-80
                     overflow-y-auto rounded-md bg-white p-2 shadow-xl"
        >
          {options.map((o) => {
            const isActive = o.id === value;
            return (
              <button
                key={o.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full rounded-md p-3 text-left transition
                            ${isActive ? 'ring-white' : 'hover:bg-gray-50'}
                            focus:bg-gray-50 outline-none`}
              >
                <div className="font-medium break-words">
                  {eventTitle} | {o.venue.city}
                </div>
                <div className="text-xs text-gray-600">
                  {formatDate(o.startsAt)} às {formatTime(o.startsAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
