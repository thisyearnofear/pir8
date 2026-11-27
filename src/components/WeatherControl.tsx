'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSafeWallet } from '@/components/SafeWalletProvider';
import { useOnChainActions } from '@/store/gameStore';
import { Icon } from './ui/Icon';

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
  const [settlingPreset, setSettlingPreset] = useState<string | null>(null);
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

  const handleDebugSettle = async (preset: 'calm' | 'storm' | 'fog') => {
    if (numericId === null || settlingPreset) return;
    setSettlingPreset(preset);
    setError(null);
    try {
      const ok = await debugSettleWeather(numericId, wallet, preset);
      if (!ok) setError('Dev settle failed — needs a live pending request.');
      await refresh();
    } finally {
      setSettlingPreset(null);
    }
  };

  if (numericId === null) return null;
  const pending = status !== null && status.pendingSeed !== 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-1)', marginTop: 'var(--p8-space-1)' }}>
      <div
        className="p8-text-dim"
        style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-mono)', fontVariantNumeric: 'tabular-nums' }}
      >
        {status === null && 'No weather request yet.'}
        {status !== null && !pending && (
          <>Settled ×{status.fulfilledCount} · {status.requestCount} request(s) total</>
        )}
        {pending && (
          <>Awaiting oracle… seed {status.pendingSeed} · attempt {status.requestCount} · settled ×{status.fulfilledCount}</>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--p8-space-1)' }}>
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="p8-btn"
          style={{ flex: 1 }}
          title="Request VRF weather randomness (game authority only)"
        >
          <Icon name={pending ? 'undo' : 'trade-winds'} size={13} />
          {isRequesting ? 'Requesting…' : pending ? 'Retry weather' : 'Call for wind'}
        </button>
        {debugEnabled && pending && (
          <div style={{ display: 'flex', gap: 'calc(2 * var(--p8-u))' }}>
            {(['calm', 'storm', 'fog'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handleDebugSettle(preset)}
                disabled={settlingPreset !== null}
                className="p8-btn"
                style={{ minHeight: 'auto', padding: 'calc(4 * var(--p8-u)) calc(6 * var(--p8-u))', textTransform: 'capitalize' }}
                title={`DEV ONLY: settle pending weather as ${preset} without the oracle`}
              >
                {settlingPreset === preset ? '…' : preset}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="p8-text-threat" style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)' }} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
