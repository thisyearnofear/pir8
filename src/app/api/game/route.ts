import { NextRequest, NextResponse } from 'next/server';
import { GameState, Player } from '../../../types/game';
import { validateMove } from '../../../utils/validation';
import { PirateGameEngine } from '../../../lib/gameLogic';

// In-memory game storage (will be replaced with Anchor program)
const games = new Map<string, GameState>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, playerId, data } = body;
    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 });
    if (action !== 'create' && !gameId) return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    if (action === 'move' && !playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });

    if (action === 'create') return handleCreateGame(gameId || `local_${Date.now()}`, data);
    if (action === 'join') return handleJoinGame(gameId!, data);
    if (action === 'move') return handleMove(gameId!, playerId!, data);
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

function handleCreateGame(gameId: string, data: { player?: Player; entryFee?: number }) {
  if (games.has(gameId)) return NextResponse.json({ error: 'Game already exists' }, { status: 409 });
  const grid = PirateGameEngine.createGrid();
  const players: Player[] = [];
  if (data?.player) {
    players.push({
      publicKey: data.player.publicKey,
      points: 0,
      bankedPoints: 0,
      hasElf: false,
      hasBauble: false,
      username: data.player.username,
    });
  }
  const game: GameState = {
    gameId,
    players,
    currentPlayerIndex: 0,
    grid,
    chosenCoordinates: [],
    gameStatus: 'waiting',
  };
  games.set(gameId, game);
  return NextResponse.json({ game });
}

function handleJoinGame(gameId: string, data: { player: Player }) {
  const game = games.get(gameId);
  if (!game) return handleCreateGame(gameId, { player: data.player });
  const exists = game.players.find(p => p.publicKey === data.player.publicKey);
  if (exists) return NextResponse.json({ game });
  if (game.players.length >= 4) return NextResponse.json({ error: 'Game is full' }, { status: 400 });
  game.players.push({
    publicKey: data.player.publicKey,
    points: 0,
    bankedPoints: 0,
    hasElf: false,
    hasBauble: false,
    username: data.player.username,
  });
  if (game.players.length >= 2 && game.gameStatus === 'waiting') game.gameStatus = 'active';
  games.set(gameId, game);
  return NextResponse.json({ game });
}

function handleMove(gameId: string, playerId: string, data: { coordinate: string }) {
  const game = games.get(gameId);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  const validation = validateMove(game, playerId, data.coordinate);
  if (!validation.isValid) return NextResponse.json({ error: validation.error }, { status: 400 });
  const player = game.players[game.currentPlayerIndex];
  const item = PirateGameEngine.getItemAtCoordinate(game.grid, data.coordinate);
  const { updatedPlayer } = PirateGameEngine.applyItemEffect(item, player);
  game.players[game.currentPlayerIndex] = updatedPlayer;
  game.chosenCoordinates.push(data.coordinate);
  if (PirateGameEngine.isGameOver(game.chosenCoordinates)) {
    const winner = PirateGameEngine.determineWinner(game.players);
    game.gameStatus = 'completed';
    game.winner = winner.publicKey;
  } else {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  }
  games.set(gameId, game);
  return NextResponse.json({ game });
}
