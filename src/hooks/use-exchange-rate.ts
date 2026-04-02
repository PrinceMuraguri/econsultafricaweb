import { useState, useEffect } from 'react';

const FALLBACK_RATE = 129;
const CACHE_KEY = 'econsult_fx_rate';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useExchangeRate() {
  const [rate, setRate] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rate: r, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return r;
      }
    } catch {}
    return FALLBACK_RATE;
  });

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return;
      } catch {}
    }
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        const kes = data?.rates?.KES;
        if (kes && kes > 50 && kes < 300) {
          setRate(kes);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate: kes, ts: Date.now() }));
        }
      })
      .catch(() => {});
  }, []);

  return { rate, toKes: (usd: number) => Math.round(usd * rate) };
}
