import { NextRequest, NextResponse } from 'next/server';
import { fetchGlobalGameState } from '@/lib/server/anchorActions';

export async function GET(request: NextRequest) {
    try {
        const gameState = await fetchGlobalGameState();
        return NextResponse.json({
            success: true,
            gameState
        });
    } catch (error) {
        console.error('Game API GET error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch game state',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Server-side transactions are deprecated. Use client-side wallet signing.',
            message: 'Web3 applications should not execute transactions on behalf of users. Connect your wallet and sign transactions directly.'
        },
        { status: 400 }
    );
}