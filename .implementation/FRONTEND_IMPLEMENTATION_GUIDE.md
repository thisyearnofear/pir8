# Skill Mechanics Frontend Implementation Guide

## Overview
The smart contracts are complete. Frontend implementation requires:
1. Anchor client methods (scan + timed move)
2. Game state hook enhancements (timer tracking)
3. UI component updates (Scan button, timer display)
4. Player stats display

**Estimated time**: 4-6 hours for full implementation

---

## 1. Anchor Client Methods

**File**: `src/lib/anchor.ts`

### Add Two New Methods

#### scanCoordinate
```typescript
async scanCoordinate(
  gameId: string,
  coordinateX: number,
  coordinateY: number
): Promise<string> {
  const gameAccount = await this.program.account.pirateGame.fetch(
    this.getGamePda(gameId)
  );
  
  const tx = await this.program.methods
    .scanCoordinate(coordinateX, coordinateY)
    .accounts({
      game: this.getGamePda(gameId),
      player: this.provider.wallet.publicKey,
    })
    .rpc();
  
  return tx;
}
```

#### makeMoveTimed
```typescript
async makeMoveTimed(
  gameId: string,
  shipId: string,
  toX: number,
  toY: number,
  decisionTimeMs: number
): Promise<string> {
  const tx = await this.program.methods
    .makeMoveTimed(shipId, toX, toY, decisionTimeMs)
    .accounts({
      game: this.getGamePda(gameId),
      player: this.provider.wallet.publicKey,
    })
    .rpc();
  
  return tx;
}
```

---

## 2. Enhance useGameState Hook

**File**: `src/hooks/useGameState.ts`

### Add Turn Timing Tracking

```typescript
export const useGameState = () => {
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [decisionTime, setDecisionTime] = useState(0);

  // Track turn start
  useEffect(() => {
    // When it becomes our turn, record the start time
    if (isCurrentPlayer) {
      setTurnStartTime(Date.now());
    }
  }, [currentPlayerIndex]);

  // Update decision time display (100ms intervals)
  useEffect(() => {
    if (!turnStartTime) return;
    
    const interval = setInterval(() => {
      setDecisionTime(Date.now() - turnStartTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [turnStartTime]);

  // Pass decision time to move
  const executeMove = async (shipId: string, toX: number, toY: number) => {
    const timeMs = turnStartTime ? Date.now() - turnStartTime : 0;
    await anchor.makeMoveTimed(gameId, shipId, toX, toY, timeMs);
    setTurnStartTime(null);
  };

  return {
    ...existing,
    turnStartTime,
    decisionTime,
    executeMove,
  };
};
```

---

## 3. GameControls Component Updates

**File**: `src/components/GameControls.tsx`

### Add Scan Button Section

```typescript
export const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  onMoveShip,
  onScan,
}) => {
  const { decisionTime, executeMove } = useGameState();

  return (
    <div className="game-controls">
      {/* Existing move controls */}

      {/* NEW: Scanning System */}
      <div className="scan-section">
        <button
          onClick={() => onScan(selectedCoordinate)}
          disabled={currentPlayer.scanCharges === 0 || !selectedCoordinate}
          className="scan-button"
        >
          📡 Scan ({currentPlayer.scanCharges}/3)
        </button>
        
        {currentPlayer.scanCharges === 0 && (
          <p className="text-warning">No scans remaining</p>
        )}
      </div>

      {/* NEW: Turn Timer */}
      <div className="timer-section">
        <div className={`timer ${getTimerColor(decisionTime)}`}>
          {formatTime(decisionTime)}
        </div>
        {decisionTime < 5000 && (
          <span className="bonus-indicator">⚡ +100 bonus!</span>
        )}
        {decisionTime < 10000 && decisionTime >= 5000 && (
          <span className="bonus-indicator">✓ +50 bonus</span>
        )}
      </div>

      {/* Existing attack/claim/build buttons */}
    </div>
  );
};

// Helper function
function getTimerColor(ms: number): string {
  if (ms < 10000) return 'green';
  if (ms < 20000) return 'yellow';
  return 'red';
}

function formatTime(ms: number): string {
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
```

### Update Coordinate Selection Display

```typescript
// Show which tiles are scanned
<GameGrid
  cells={gameMap.cells}
  scannedCoordinates={currentPlayer.scannedCoordinates}
  onCellClick={(x, y) => handleCoordinateSelect(x, y)}
/>
```

---

## 4. PlayerStats Component Updates

**File**: `src/components/PlayerStats.tsx`

### Add Skill Mechanics Display

```typescript
export const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  return (
    <div className="player-stats">
      {/* Existing stats */}
      
      {/* NEW: Skill Mechanics Stats */}
      <section className="skill-stats">
        <h3>Skill Mechanics</h3>
        
        <div className="stat-row">
          <label>📡 Scan Charges</label>
          <div className="scan-charges">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`scan-pip ${i < player.scanCharges ? 'active' : 'used'}`}
              />
            ))}
            <span>{player.scanCharges}/3</span>
          </div>
        </div>

        <div className="stat-row">
          <label>⚡ Speed Bonus</label>
          <span className="bonus-points">+{player.speedBonusAccumulated}</span>
        </div>

        <div className="stat-row">
          <label>⏱️ Avg Decision Time</label>
          <span>{(player.averageDecisionTimeMs / 1000).toFixed(1)}s</span>
        </div>

        <div className="stat-row">
          <label>Moves Made</label>
          <span>{player.totalMoves}</span>
        </div>

        {/* Scanned coordinates */}
        <div className="scanned-tiles">
          <label>Scanned Tiles ({player.scannedCoordinates.length})</label>
          <div className="tiles-list">
            {player.scannedCoordinates.map(coord => (
              <span key={coord} className="tile-badge">{coord}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
```

---

## 5. GameGrid Component Enhancement

**File**: `src/components/GameGrid.tsx`

### Show Scanned Tiles Differently

```typescript
<div className="game-grid">
  {cells.map((row, x) =>
    row.map((cell, y) => {
      const coord = `${x},${y}`;
      const isScanned = scannedCoordinates.includes(coord);
      
      return (
        <div
          key={`${x}-${y}`}
          className={`grid-cell 
            ${cell.type}
            ${isScanned ? 'scanned' : 'hidden'}
            ${isSelected(x, y) ? 'selected' : ''}
          `}
          onClick={() => onCellClick(x, y)}
        >
          {isScanned && <span className="tile-type">{cell.type}</span>}
          {!isScanned && '?'}
        </div>
      );
    })
  )}
</div>
```

### Add Styling for Scanned Tiles

```css
.grid-cell {
  position: relative;
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.grid-cell.hidden {
  background-color: #1a1a2e;
  color: #fff;
  font-weight: bold;
}

.grid-cell.scanned {
  background-color: #0f3460;
  border-color: #00d4ff;
}

.grid-cell.water.scanned {
  background-color: #1e5a8e;
}

.grid-cell.port.scanned {
  background-color: #8b4513;
}

.grid-cell.treasure.scanned {
  background-color: #ffd700;
  color: #000;
}

.grid-cell.island.scanned {
  background-color: #228b22;
}

.grid-cell.storm.scanned {
  background-color: #2f4f4f;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 6. Event Listener Updates

### Listen for CoordinateScanned Events

```typescript
// In useHeliusMonitor hook
if (log.includes('CoordinateScanned')) {
  const event = parser.parseEvent('CoordinateScanned', log);
  // Add to game state
  updateScannedCoordinate(event.coordinate_x, event.coordinate_y);
  showNotification(`📡 Scanned: ${event.tile_type}`);
}

// Listen for MoveExecuted events
if (log.includes('MoveExecuted')) {
  const event = parser.parseEvent('MoveExecuted', log);
  if (event.speed_bonus_awarded > 0) {
    showNotification(`⚡ Speed bonus: +${event.speed_bonus_awarded}`);
  }
  updatePlayerStats(event);
}
```

---

## 7. Testing Checklist

### Component Tests
- [ ] Scan button appears only during player's turn
- [ ] Scan button disabled when scanCharges = 0
- [ ] Timer increments correctly in 100ms intervals
- [ ] Timer color changes (green → yellow → red)
- [ ] Speed bonus notifications appear
- [ ] Scanned tiles display correctly on grid
- [ ] PlayerStats shows correct skill values

### Integration Tests
- [ ] Scan instruction called correctly with params
- [ ] Decision time passed to makeMoveTimed
- [ ] Player state updates after scan (scanCharges decrements)
- [ ] Player state updates after move (speedBonusAccumulated increases)
- [ ] Events processed and displayed in UI

---

## 8. Accessibility & UX Enhancements

### Keyboard Support
```typescript
// Allow 'S' to initiate scan
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 's' || e.key === 'S') {
      if (canScan) openScanMode();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [canScan]);
```

### Mobile Touch Support
- Tap to scan (touch-friendly button)
- Large hit targets for timer display
- Haptic feedback on scan/speed bonus

---

## Estimated Effort

| Component | Effort | Status |
|-----------|--------|--------|
| Anchor client methods | 30 min | ⏳ Todo |
| useGameState hook | 1 hour | ⏳ Todo |
| GameControls button | 1 hour | ⏳ Todo |
| Timer display | 1 hour | ⏳ Todo |
| GameGrid styling | 1 hour | ⏳ Todo |
| PlayerStats display | 1 hour | ⏳ Todo |
| Event listeners | 1 hour | ⏳ Todo |
| Testing | 2 hours | ⏳ Todo |
| Polish & UX | 1 hour | ⏳ Todo |

**Total**: 10 hours for full implementation

---

## Notes

- Timer should pause during other players' turns
- Scanned tiles remain visible for the entire game
- Speed bonuses are per-move (not cumulative modifier)
- Decision time is measured from when turn starts on client side
- Scan coordinates returned as "x,y" strings matching GameGrid

