import { create } from "zustand/react";
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

export const usePirateGame = () => usePirateGameStore((state) => state);
export const usePirateGameState = usePirateGameStore;
