'use client';

import { useEffect, useState } from 'react';
import { isWebGLAvailable } from '@/lib/webgl-support';

export function useWebGLAvailable() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setAvailable(isWebGLAvailable());

    check();

    const retryId = window.setTimeout(check, 500);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(retryId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return available;
}
