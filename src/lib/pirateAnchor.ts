import { AnchorProvider, Program, BN, Idl } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram, Connection } from '@solana/web3.js';
import { GameState, Player, Ship, Resources, GameEvent } from '../types/game';

// Pirate game account interfaces matching the Rust structs
export interface PirateGameAccount {
  gameId: BN;
  authority: PublicKey;
  status: { waitingForPlayers: {} } | { active: {} } | { completed: {} };
  players: PiratePlayerData[];
  playerCount: number;
  currentPlayerIndex: number;
  territoryMap: TerritoryCell[][];
  entryFee: BN;
  totalPot: BN;
  maxPlayers: number;
  turnNumber: number;
  createdAt: BN;
  startedAt: BN | null;
  completedAt: BN | null;
  winner: PublicKey | null;
  weatherType: { calm: {} } | { tradeWinds: {} } | { storm: {} } | { fog: {} };
  weatherDuration: number;
  bump: number;
}

export interface PiratePlayerData {
  pubkey: PublicKey;
  resources: PirateResources;
  ships: ShipData[];
  controlledTerritories: string[];
  totalScore: number;
  isActive: boolean;
}

export interface PirateResources {
  gold: number;
  crew: number;
  cannons: number;
  supplies: number;
}

export interface ShipData {
  id: string;
  shipType: { sloop: {} } | { frigate: {} } | { galleon: {} } | { flagship: {} };
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  positionX: number;
  positionY: number;
  lastActionTurn: number;
}

export interface TerritoryCell {
  cellType: { water: {} } | { island: {} } | { port: {} } | { treasure: {} } | { storm: {} } | { reef: {} } | { whirlpool: {} };
  owner: PublicKey | null;
}

// Enhanced PIR8 Instructions for pirate game
export class PIR8PirateInstructions {
  constructor(
    private program: Program,
    private provider: AnchorProvider
  ) {}

  async createGame(entryFee: number, maxPlayers: number): Promise<{ tx: string; gameId: PublicKey }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampBytes = Buffer.allocUnsafe(8);
    timestampBytes.writeBigInt64LE(BigInt(timestamp), 0);
    
    const [gameId] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pirate_game"),
        this.provider.wallet.publicKey.toBuffer(),
        timestampBytes
      ],
      this.program.programId
    );
    
    const tx = await this.program.methods
      .createGame(new BN(entryFee), maxPlayers)
      .accounts({
        game: gameId,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    return { tx, gameId };
  }

  async joinGame(gameId: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .joinGame()
      .accounts({
        game: gameId,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
      
    return tx;
  }

  async moveShip(
    gameId: PublicKey, 
    shipId: string, 
    toX: number, 
    toY: number
  ): Promise<string> {
    const tx = await this.program.methods
      .moveShip(shipId, toX, toY)
      .accounts({
        game: gameId,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
      
    return tx;
  }

  async attackShip(
    gameId: PublicKey, 
    attackerShipId: string, 
    targetShipId: string
  ): Promise<string> {
    const tx = await this.program.methods
      .attackShip(attackerShipId, targetShipId)
      .accounts({
        game: gameId,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
      
    return tx;
  }

  async claimTerritory(
    gameId: PublicKey, 
    shipId: string
  ): Promise<string> {
    const tx = await this.program.methods
      .claimTerritory(shipId)
      .accounts({
        game: gameId,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
      
    return tx;
  }

  async getGame(gameId: PublicKey): Promise<PirateGameAccount | null> {
    try {
      const account = await this.program.account.pirateGame.fetch(gameId);
      return account as PirateGameAccount;
    } catch (error) {
      console.error('Failed to fetch game:', error);
      return null;
    }
  }
}

// Utility functions for converting between blockchain and frontend types
export class PirateGameConverter {
  static convertToFrontendGameState(
    gameAccount: PirateGameAccount, 
    gameId: string
  ): GameState {
    return {
      gameId,
      players: gameAccount.players.map(this.convertToFrontendPlayer),
      currentPlayerIndex: gameAccount.currentPlayerIndex,
      gameMap: {
        cells: gameAccount.territoryMap.map(row => 
          row.map(cell => this.convertToFrontendCell(cell))
        ),
        size: 10
      },
      gameStatus: this.convertGameStatus(gameAccount.status),
      winner: gameAccount.winner?.toString(),
      currentPhase: 'movement', // Default phase
      turnNumber: gameAccount.turnNumber,
      turnTimeRemaining: 45000, // Default timeout
      pendingActions: [],
      eventLog: [],
      globalWeather: this.convertWeatherType(gameAccount.weatherType, gameAccount.weatherDuration),
    };
  }

  static convertToFrontendPlayer(playerData: PiratePlayerData): Player {
    return {
      publicKey: playerData.pubkey.toString(),
      resources: {
        gold: playerData.resources.gold,
        crew: playerData.resources.crew,
        cannons: playerData.resources.cannons,
        supplies: playerData.resources.supplies,
      },
      ships: playerData.ships.map(this.convertToFrontendShip),
      controlledTerritories: playerData.controlledTerritories,
      totalScore: playerData.totalScore,
      isActive: playerData.isActive,
      // Skill mechanics initialization
      scanCharges: 3,
      scannedCoordinates: [],
      speedBonusAccumulated: 0,
      averageDecisionTimeMs: 0,
      totalMoves: 0,
    };
  }

  static convertToFrontendShip(shipData: ShipData): Ship {
    return {
      id: shipData.id,
      type: this.convertShipType(shipData.shipType),
      health: shipData.health,
      maxHealth: shipData.maxHealth,
      attack: shipData.attack,
      defense: shipData.defense,
      speed: shipData.speed,
      position: {
        x: shipData.positionX,
        y: shipData.positionY
      },
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0 },
    };
  }

  static convertToFrontendCell(territoryCell: TerritoryCell): any {
    return {
      coordinate: '', // Will be set by the caller
      type: this.convertTerritoryCellType(territoryCell.cellType),
      owner: territoryCell.owner?.toString() || null,
      resources: {},
      isContested: false,
    };
  }

  private static convertGameStatus(
    status: { waitingForPlayers: {} } | { active: {} } | { completed: {} }
  ): 'waiting' | 'active' | 'completed' {
    if ('waitingForPlayers' in status) return 'waiting';
    if ('active' in status) return 'active';
    return 'completed';
  }

  private static convertShipType(
    shipType: { sloop: {} } | { frigate: {} } | { galleon: {} } | { flagship: {} }
  ): 'sloop' | 'frigate' | 'galleon' | 'flagship' {
    if ('sloop' in shipType) return 'sloop';
    if ('frigate' in shipType) return 'frigate';
    if ('galleon' in shipType) return 'galleon';
    return 'flagship';
  }

  private static convertTerritoryCellType(
    cellType: { water: {} } | { island: {} } | { port: {} } | { treasure: {} } | { storm: {} } | { reef: {} } | { whirlpool: {} }
  ): 'water' | 'island' | 'port' | 'treasure' | 'storm' | 'reef' | 'whirlpool' {
    if ('water' in cellType) return 'water';
    if ('island' in cellType) return 'island';
    if ('port' in cellType) return 'port';
    if ('treasure' in cellType) return 'treasure';
    if ('storm' in cellType) return 'storm';
    if ('reef' in cellType) return 'reef';
    return 'whirlpool';
  }

  private static convertWeatherType(
    weatherType: { calm: {} } | { tradeWinds: {} } | { storm: {} } | { fog: {} },
    duration: number
  ): any {
    let type: 'calm' | 'trade_winds' | 'storm' | 'fog';
    
    if ('calm' in weatherType) type = 'calm';
    else if ('tradeWinds' in weatherType) type = 'trade_winds';
    else if ('storm' in weatherType) type = 'storm';
    else type = 'fog';

    return {
      type,
      duration,
      effect: this.getWeatherEffects(type)
    };
  }

  private static getWeatherEffects(type: string): any {
    switch (type) {
      case 'calm':
        return { resourceModifier: 1.2, movementModifier: 1.0 };
      case 'trade_winds':
        return { movementModifier: 1.5, resourceModifier: 1.1 };
      case 'storm':
        return { movementModifier: 0.5, damageModifier: 1.3, resourceModifier: 0.8 };
      case 'fog':
        return { visibilityReduced: true, movementModifier: 0.7, damageModifier: 0.8 };
      default:
        return {};
    }
  }
}

// Enhanced hook for using pirate anchor integration
export function usePirateAnchor() {
  // This would be implemented similar to your existing useAnchorProgram
  // but with the new pirate game types and methods
  return {
    program: null, // Your program instance
    provider: null, // Your provider instance
    instructions: null as PIR8PirateInstructions | null,
    isConnected: false,
  };
}