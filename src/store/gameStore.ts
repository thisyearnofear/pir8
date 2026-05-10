import { create } from "zustand";
import { PirateGameStore } from "./types";
import { createGameSlice } from "./gameSlice";
import { createOnChainSlice } from "./onChainSlice";
import { createPracticeSlice } from "./practiceSlice";
import { createSkillSlice } from "./skillSlice";

export const usePirateGameStore = create<PirateGameStore>((...a) => ({
  ...createGameSlice(...a),
  ...createOnChainSlice(...a),
  ...createPracticeSlice(...a),
  ...createSkillSlice(...a),
}));

// Export for backward compatibility if needed, but preferred is usePirateGameStore
export const usePirateGameState = usePirateGameStore;
