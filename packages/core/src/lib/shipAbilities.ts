// Re-export from the canonical shipAbilities implementation in src/lib.
// This shim exists so that packages/core can resolve the module during tests.
export {
  SHIP_ABILITIES,
  initializeShipAbility,
  canUseAbility,
  useShipAbility,
  tickAbilityCooldown,
  tickShipEffects,
  getEffectiveStats,
} from "../../../../src/lib/shipAbilities";
