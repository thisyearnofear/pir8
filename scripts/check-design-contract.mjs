#!/usr/bin/env node
/**
 * check-design-contract.mjs — Slice 12 enforcement.
 *
 * Converted (token-native) surfaces must not regress under parallel agents:
 * no `neon-*` utilities and no emoji iconography in the protected files.
 * Run: `pnpm check-contract`. Also wired into lint-staged so any staged
 * change under src/components re-verifies the protected set.
 *
 * Known exception: TerritoryBonusPanel's BONUS_ICONS translation map still
 * carries the data layer's emoji as keys by design (DESIGN.md §5) until
 * Slice 11 cleans the data layer. That single block is stripped before the
 * emoji scan — everything else in the file is enforced.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const PROTECTED = [
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
];

const NEON_RE = /neon-/g;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
// Slice-11-deferred block: data-layer emoji keys awaiting cleanup.
const BONUS_ICONS_BLOCK_RE =
  /const BONUS_ICONS: Record<string, IconName> = \{[\s\S]*?\};/;

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

  const scannable =
    rel === "src/components/TerritoryBonusPanel.tsx"
      ? text.replace(BONUS_ICONS_BLOCK_RE, "/* BONUS_ICONS exempt until slice 11 */")
      : text;
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
