'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSafeWallet } from '@/components/SafeWalletProvider';
import { useOnChainActions } from '@/store/gameStore';

interface WeatherControlProps {
  gameId: string | number;
}

const normalizeGameId = (gameId: string | number): number | null => {
  const n = typeof gameId === 'string'
    ? parseInt(gameId.replace('onchain_', ''), 10)
    : gameId;
  return Number.isFinite(n) ? n : null;
};

/**
 * VRF weather widget. Requests on-chain weather randomness, polls the
 * per-game WeatherState PDA, and surfaces pending vs fulfilled status.
 * The oracle may take a while (or never answer on a quiet devnet queue),
 * so the pending state is the normal case, not an error.
 */
export default function WeatherControl({ gameId }: WeatherControlProps) {
  const wallet = useSafeWallet();
  const { requestWeather, fetchWeatherState, debugSettleWeather } = useOnChainActions();
  const [status, setStatus] = useState<{
    pendingSeed: number;
    requestCount: number;
    fulfilledCount: number;
  } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericId = normalizeGameId(gameId);
  const debugEnabled = process.env['NEXT_PUBLIC_ENABLE_WEATHER_DEBUG'] === 'true';

  const refresh = useCallback(async () => {
    if (numericId === null) return;
    try {
      const s = await fetchWeatherState(numericId, wallet);
      setStatus(s);
    } catch {
      // PDA may not exist yet — not an error.
    }
  }, [numericId, wallet, fetchWeatherState]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleRequest = async () => {
    if (numericId === null || isRequesting) return;
    setIsRequesting(true);
    setError(null);
    try {
      const seed = await requestWeather(numericId, wallet);
      if (seed === null) setError('Weather request failed — is this your game (authority only)?');
      await refresh();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDebugSettle = async () => {
    if (numericId === null || isSettling) return;
    setIsSettling(true);
    setError(null);
    try {
      const ok = await debugSettleWeather(numericId, wallet);
      if (!ok) setError('Dev settle failed — needs a live pending request.');
      await refresh();
    } finally {
      setIsSettling(false);
    }
  };

  if (numericId === null) return null;
  const pending = status !== null && status.pendingSeed !== 0;

  return (
    <div className="weather-control mt-2 space-y-2">
      <div className="text-xs text-gray-300">
        {status === null && 'No weather request yet.'}
        {status !== null && !pending && (
          <>Settled ×{status.fulfilledCount} · {status.requestCount} request(s) total</>
        )}
        {pending && (
          <>Awaiting oracle… seed {status.pendingSeed} · attempt {status.requestCount} · settled ×{status.fulfilledCount}</>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-neon-cyan/80 hover:bg-neon-cyan
                     text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Request VRF weather randomness (game authority only)"
        >
          {isRequesting ? '⏳ Requesting…' : pending ? '🔄 Retry weather' : '🌊 Call for wind'}
        </button>
        {debugEnabled && pending && (
          <button
            onClick={handleDebugSettle}
            disabled={isSettling}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/80 hover:bg-amber-500
                       text-black transition-all disabled:opacity-50"
            title="DEV ONLY: settle pending weather without the oracle"
          >
            {isSettling ? '⏳…' : '🧪 Dev settle'}
          </button>
        )}
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
