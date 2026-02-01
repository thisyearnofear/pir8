import { NextRequest, NextResponse } from 'next/server';
import { ZcashMemoBridge } from '@/lib/integrations';
import { getAnchorClient } from '@/lib/server/anchorActions';
import { handleShieldedMemo } from '@/cli/commands/game';

export async function POST(request: NextRequest) {
    try {
        const { memo, zcashTxHash, blockHeight } = await request.json();

        if (!memo) {
            return NextResponse.json({ error: 'Memo is required' }, { status: 400 });
        }

        // Parse and validate memo
        const bridge = new ZcashMemoBridge(async () => { }); // Temporary callback
        const parsed = bridge.parseMemo(memo);

        if (!parsed) {
            return NextResponse.json({ error: 'Invalid memo format' }, { status: 400 });
        }

        // Execute Solana transaction
        const client = await getAnchorClient();
        const result = await handleShieldedMemo(client.program, client.provider, parsed.gameId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                action: result.action,
                gameId: result.gameId,
                solanaTx: result.txHash || 'pending',
                zcashTx: zcashTxHash,
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error('Zcash API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}