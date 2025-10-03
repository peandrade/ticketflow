'use client';

import React from 'react';
import { useEffect } from 'react';

export function PrintAuto() {
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.print();
      } catch {}
    }, 100);
    return () => clearTimeout(id);
  }, []);
  return null;
}
