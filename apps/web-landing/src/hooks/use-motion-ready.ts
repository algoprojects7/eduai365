'use client';

import { useEffect, useState } from 'react';

/** Avoid Framer Motion SSR hiding content at opacity:0 before hydration. */
export function useMotionReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
