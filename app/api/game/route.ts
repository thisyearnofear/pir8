import { NextResponse } from 'next/server';
import { fetchGlobalGameState } from '@/lib/server/anchorActions';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = parseInt(searchParams.get('gameId') || '0', 10);
        
        const gameState = await fetchGlobalGameState(gameId);
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

export async function POST() {
    return NextResponse.json(
        {
            error: 'Server-side transactions are deprecated. Use client-side wallet signing.',
            message: 'Web3 applications should not execute transactions on behalf of users. Connect your wallet and sign transactions directly.'
        },
        { status: 400 }
    );
}