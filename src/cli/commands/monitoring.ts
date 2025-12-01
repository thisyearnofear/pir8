import WebSocket from 'ws';

export interface HeliusMonitorResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Monitor Helius for game-related transactions
 */
export async function monitorHelius(apiKey: string, treasuryAddress: string): Promise<HeliusMonitorResult> {
  try {
    const ws = new WebSocket(`wss://atlas-devnet.helius-rpc.com/?api-key=${apiKey}`);

    ws.on('open', () => {
      console.log('Connected to Helius');
      
      const subscription = {
        jsonrpc: '2.0',
        id: 1,
        method: 'transactionSubscribe',
        params: [
          {
            accountInclude: [treasuryAddress],
            failed: false,
            vote: false,
          },
          {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            maxSupportedTransactionVersion: 0,
          },
        ],
      };

      ws.send(JSON.stringify(subscription));

      // Keep-alive ping
      setInterval(() => {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: Math.random(), method: 'ping' }));
      }, 60000);
    });

    ws.on('message', (data: any) => {
      const message = JSON.parse(data.toString());
      
      if (message.result?.value?.transaction) {
        const tx = message.result.value.transaction;
        console.log('Detected transaction:', tx.signatures[0]);
        
        // Parse instructions
        tx.message.instructions.forEach((instr: any) => {
          if (instr.program === 'spl-token' && instr.parsed?.type === 'transfer') {
            const amount = instr.parsed.info.tokenAmount.uiAmount;
            console.log(`Token deposit: ${amount}`);
          }
          
          if (instr.program === 'system' && instr.parsed?.type === 'transfer') {
            const amount = instr.parsed.info.lamports / 1e9;
            console.log(`SOL deposit: ${amount}`);
          }
        });
      }
    });

    ws.on('error', (err: any) => {
      console.error('WebSocket error:', err);
    });

    // Keep running
    return {
      success: true,
      message: 'Monitoring started. Press Ctrl+C to stop.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to start monitoring',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
