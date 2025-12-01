import type { NextApiRequest, NextApiResponse } from 'next';
import { GameState, Player } from '@/types/game';
import { PirateGameEngine } from '@/lib/gameLogic';
import { validateMove } from '@/utils/validation';

const games = new Map<string, GameState>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const gameId = req.query.gameId as string;
    if (!gameId) return res.status(400).json({ error: 'Game ID required' });
    const game = games.get(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    return res.status(200).json({ game });
  }

  if (req.method === 'POST') {
    const { action, gameId, playerId, data } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Action required' });
    if (action !== 'create' && !gameId) return res.status(400).json({ error: 'Game ID required' });
    if (action === 'move' && !playerId) return res.status(400).json({ error: 'Player ID required' });

    if (action === 'create') {
      const id = gameId || `local_${Date.now()}`;
      if (games.has(id)) return res.status(409).json({ error: 'Game already exists' });
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
        gameId: id,
        players,
        currentPlayerIndex: 0,
        grid,
        chosenCoordinates: [],
        gameStatus: 'waiting',
      };
      games.set(id, game);
      return res.status(200).json({ game });
    }

    if (action === 'join') {
      const id = gameId as string;
      const game = games.get(id);
      if (!game) {
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
        const newGame: GameState = {
          gameId: id,
          players,
          currentPlayerIndex: 0,
          grid,
          chosenCoordinates: [],
          gameStatus: 'waiting',
        };
        games.set(id, newGame);
        return res.status(200).json({ game: newGame });
      }
      const exists = game.players.find(p => p.publicKey === data.player.publicKey);
      if (exists) return res.status(200).json({ game });
      if (game.players.length >= 4) return res.status(400).json({ error: 'Game is full' });
      game.players.push({
        publicKey: data.player.publicKey,
        points: 0,
        bankedPoints: 0,
        hasElf: false,
        hasBauble: false,
        username: data.player.username,
      });
      if (game.players.length >= 2 && game.gameStatus === 'waiting') game.gameStatus = 'active';
      games.set(id, game);
      return res.status(200).json({ game });
    }

    if (action === 'move') {
      const id = gameId as string;
      const game = games.get(id);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      const validation = validateMove(game, playerId, data.coordinate);
      if (!validation.isValid) return res.status(400).json({ error: validation.error });
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
      games.set(id, game);
      return res.status(200).json({ game });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
