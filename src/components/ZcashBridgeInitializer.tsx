'use client';

import { useZcashBridge } from '@/hooks/useZcashBridge';
import { useEffect, useState } from 'react';

/**
 * ZcashBridgeInitializer - Wires the Zcash bridge to app root
 * Monitors Lightwalletd for incoming shielded transactions
 * Executes join_game automatically when valid memo detected
 */
export function ZcashBridgeInitializer() {
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const { isConnected, isEnabled } = useZcashBridge({
    enabled: true,
    onEntrySuccess: (payload, solanaTx) => {
      console.log('✅ Private entry successful');
      console.log(`  Player: ${payload.solanaPubkey}`);
      console.log(`  Game: ${payload.gameId}`);
      console.log(`  Zcash TX: ${payload.zcashTxHash}`);
      console.log(`  Solana TX: ${solanaTx}`);
      setBridgeStatus('connected');
      setStatusMessage(`Private entry successful. Solana TX: ${solanaTx.slice(0, 20)}...`);
    },
    onEntryError: (error, payload) => {
      console.error('❌ Private entry failed:', error.message);
      if (payload) {
        console.error(`  Attempted game: ${payload.gameId}`);
        console.error(`  Player: ${payload.solanaPubkey}`);
      }
      setBridgeStatus('error');
      setStatusMessage(`Error: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!isEnabled) {
      setBridgeStatus('idle');
      setStatusMessage('Zcash bridge disabled');
      return;
    }

    if (isConnected) {
      setBridgeStatus('connected');
      setStatusMessage('🔒 Zcash bridge active - monitoring for private entries');
    } else {
      setBridgeStatus('connecting');
      setStatusMessage('Connecting to Zcash...');
    }
  }, [isConnected, isEnabled]);

  return (
    <div className="hidden">
      {/* Bridge initializer - runs silently in background */}
      <div
        data-testid="zcash-bridge-initializer"
        data-status={bridgeStatus}
        data-message={statusMessage}
      />
    </div>
  );
}
