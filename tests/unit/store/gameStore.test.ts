import { usePirateGameStore } from "@/store/gameStore";
import { GameState } from "@/types/game";

describe("PirateGameStore", () => {
  beforeEach(() => {
    // Reset store before each test if needed
    // usePirateGameStore.setState(initialState);
  });

  it("should initialize with default state", () => {
    const state = usePirateGameStore.getState();
    expect(state.gameState).toBeNull();
    expect(state.gameMode).toBe("on-chain");
    expect(state.isLoading).toBe(false);
  });

  it("should update game mode", () => {
    const { setGameMode } = usePirateGameStore.getState();
    setGameMode("practice");
    expect(usePirateGameStore.getState().gameMode).toBe("practice");
  });

  it("should set game state", () => {
    const { setGameState } = usePirateGameStore.getState();
    const mockState = { gameId: "test" } as any as GameState;
    setGameState(mockState);
    expect(usePirateGameStore.getState().gameState).toBe(mockState);
  });

  it("should select a ship", () => {
    const { selectShip } = usePirateGameStore.getState();
    selectShip("ship1");
    expect(usePirateGameStore.getState().selectedShipId).toBe("ship1");
  });
});
