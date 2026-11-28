#!/usr/bin/env node
/**
 * check-design-contract.mjs — cabin design contract enforcement.
 *
 * Converted (token-native) surfaces must not regress under parallel agents:
 * no `neon-*` utilities and no emoji iconography in the protected files.
 * Run: `pnpm check-contract`. Also wired into lint-staged so any staged
 * change under src/components re-verifies the protected set.
 *
 * Known exceptions (by design, DESIGN.md §5): the BONUS_ICONS map in
 * TerritoryBonusPanel and the VIRAL_ICONS map in ViralEventModal translate
 * bounded data-layer emoji sets into instruments at render. Those two blocks
 * are stripped before the emoji scan — everything else in the files is
 * enforced. Engine display names (AI difficulty labels) are stripped of
 * debug glyphs at the source (src/lib/engine/ai.ts), so they need no scan.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const PROTECTED = [
  // Slice 12: converted instrument surfaces.
  "src/components/hud/InstrumentStrip.tsx",
  "src/components/hud/ActionRail.tsx",
  "src/components/hud/MenuDrawer.tsx",
  "src/components/PlayerStats.tsx",
  "src/components/BattleInfoPanel.tsx",
  "src/components/GameEventLog.tsx",
  "src/components/TerritoryBonusPanel.tsx",
  "src/components/PirateControls.tsx",
  "src/components/WeatherControl.tsx",
  "src/components/ShipBuildingPanel.tsx",
  "src/components/VictoryScreen.tsx",
  "src/components/VictoryProgress.tsx",
  // Cabin conversion rounds 2-3: shell, entry, practice loop, lobby,
  // spectator, AI arenas, feedback surfaces.
  "src/components/GameHeader.tsx",
  "src/components/EmptyStateView.tsx",
  "src/components/GameContainer.tsx",
  "src/components/PirateMap.tsx",
  "src/components/Toast.tsx",
  "src/components/ShipActionModal.tsx",
  "src/components/onboarding/FirstTimeTutorial.tsx",
  "src/components/onboarding/ContextualHints.tsx",
  "src/components/OnboardingModal.tsx",
  "src/components/modals/PracticeMenuModal.tsx",
  "src/components/modals/PracticeModeBanner.tsx",
  "src/components/LobbyBrowser.tsx",
  "src/components/SpectatorView.tsx",
  "src/components/AIDecisionModal.tsx",
  "src/components/AIBattleModal.tsx",
  "src/components/chart/ChartStage.tsx",
  "src/components/Preloader.tsx",
  "src/components/effects/ConfettiCelebration.tsx",
  "src/hooks/useSoundEffects.tsx",
  // Cabin conversion round 4: tooltips, previews, AI controls, modals,
  // leaderboard, resource panel, mobile shell.
  "src/components/TerritoryTooltip.tsx",
  "src/components/DamagePreview.tsx",
  "src/components/AIBattleErrorBoundary.tsx",
  "src/components/ResourceCollectionPanel.tsx",
  "src/components/AIBattleControls.tsx",
  "src/components/ViralEventModal.tsx",
  "src/components/modals/ModeSelectModal.tsx",
  "src/components/AgentArenaLeaderboard.tsx",
  "src/components/mobile/MobileGameContainer.tsx",
  // Round 5: generic crash fallback (user-facing, previously unstyled).
  "src/components/ErrorBoundary.tsx",
  // Round 6: live AI + privacy surfaces found on the practice-game scene
  // (difficulty debug glyphs now stripped at the engine source).
  "src/components/AIReasoningPanel.tsx",
  "src/components/AIStreamPanel.tsx",
  "src/components/privacy/LeakageMeter.tsx",
];

const NEON_RE = /neon-/g;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
// Data-layer emoji keys live here by design (bounded sets emitted by game
// logic) and are translated to instruments at render. Stripped before the
// emoji scan — everything else in these files is enforced.
const BONUS_ICONS_BLOCK_RE =
  /const BONUS_ICONS: Record<string, IconName> = \{[\s\S]*?\};/;
const VIRAL_ICONS_BLOCK_RE =
  /const VIRAL_ICONS: Record<string, IconName> = \{[\s\S]*?\};/;

let failures = 0;

for (const rel of PROTECTED) {
  const abs = path.join(root, rel);
  let text;
  try {
    text = fs.readFileSync(abs, "utf8");
  } catch {
    console.error(`MISSING protected file: ${rel}`);
    failures++;
    continue;
  }

  const neonHits = text.match(NEON_RE) || [];
  if (neonHits.length > 0) {
    console.error(
      `NEON  ${rel}: ${neonHits.length} forbidden neon- util(s) — use design tokens (DESIGN.md).`,
    );
    failures++;
  }

  let scannable = text;
  if (rel === "src/components/TerritoryBonusPanel.tsx") {
    scannable = scannable.replace(BONUS_ICONS_BLOCK_RE, "/* BONUS_ICONS data map */");
  }
  if (rel === "src/components/ViralEventModal.tsx") {
    scannable = scannable.replace(VIRAL_ICONS_BLOCK_RE, "/* VIRAL_ICONS data map */");
  }
  const emojiHits = scannable.match(EMOJI_RE) || [];
  if (emojiHits.length > 0) {
    console.error(
      `EMOJI ${rel}: ${emojiHits.length} emoji char(s) — use the shared Icon component (DESIGN.md §5).`,
    );
    failures++;
  }
}

if (failures > 0) {
  console.error(`\nDesign contract violated in ${failures} file(s).`);
  process.exit(1);
}

console.log(`Design contract holds across ${PROTECTED.length} protected surfaces.`);
