import { NextRequest, NextResponse } from 'next/server';
import { GameState, Player } from '../../../types/game';
import { validateGameState, validateMove } from '../../../utils/validation';

// In-memory game storage (will be replaced with Anchor program)
const games = new Map<string, GameState>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, playerId, data } = body;

    switch (action) {
      case 'create':
        return handleCreateGame(data);
      case 'join':
        return handleJoinGame(gameId, data);
      case 'move':
        return handleMove(gameId, playerId, data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return NextResponse.json(
      { error: 'Game ID required' },
      { status: 400 }
    );
  }

  const game = games.get(gameId);
  if (!game) {
    return NextResponse.json(
      { error: 'Game not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ game });
}

function handleCreateGame(data: { players: Player[]; entryFee: number }) {
  // Implementation will be moved to Anchor program
  return NextResponse.json({ message: 'Game creation will be handled by Anchor' });
}

function handleJoinGame(gameId: string, data: { player: Player }) {
  // Implementation will be moved to Anchor program
  return NextResponse.json({ message: 'Game joining will be handled by Anchor' });
}

function handleMove(gameId: string, playerId: string, data: { coordinate: string }) {
  // Implementation will be moved to Anchor program
  return NextResponse.json({ message: 'Game moves will be handled by Anchor' });
}