# Sonilo soundbank — pir8 — naval combat

AI-generated audio bank created with [Sonilo](https://sonilo.com) (Pro trial, November 2026),
loudness-normalized (SFX −16 LUFS / music −18 LUFS / ambience −30 LUFS, TP −1.5) and encoded as OGG Vorbis q6.

## Usage doctrine

- **Round-robin the variations**: never play the same variant twice in a row; random pitch ±5% / volume ±1dB at runtime hides repetition further.
- Files are named `<event>_g<generation>v<variant>.ogg` — all files under one event folder are interchangeable variations.
- Beds (ambience/long music) are not seamless loops: crossfade ~2s at the loop point or alternate two cues.

## Events

### sfx/cannon_boom_sub (2s target)
- prompt: `cannon fire low frequency layer only: deep subsonic powder boom, massive low-end thump, no crack or echo, black powder naval cannon, close`

### sfx/cannon_crack_body (1.5s target)
- prompt: `cannon fire midrange crack layer: sharp explosive black powder crack with brief muzzle blast texture, naval cannon, no echo tail, dry`

### sfx/cannon_echo_water (4s target)
- prompt: `cannon blast echo rolling across open water: long fading echo tail over the sea, distant thunderous decay, no initial blast, spacious`

### sfx/cannon_distant (3s target)
- prompt: `distant cannon fire heard across the ocean: muffled thunder boom, far away naval battle, soft attack, long gentle decay`

### sfx/hull_impact (1.5s target)
- prompt: `cannonball smashing into wooden ship hull: heavy wood impact crack with splintering, violent and close, naval battle, single hit`

### sfx/wood_splinter_debris (1.5s target)
- prompt: `wooden splinters and debris scattering: sharp wood cracking and small fragments scattering on deck, aftermath of hull breach, no initial impact`

### sfx/hull_creak (2s target)
- prompt: `old wooden ship hull creaking: single slow deep timber groan, organic wood strain, tall ship at sea, quiet intimate detail`

### sfx/rigging_strain (2s target)
- prompt: `sailing ship rigging under strain: ropes creaking and stretching, canvas sail flapping once in strong wind, tall ship detail`

### sfx/sail_flap (2s target)
- prompt: `large canvas sail flapping and snapping in ocean wind, heavy cloth movement, tall ship, gusty`

### sfx/splash (1.5s target)
- prompt: `heavy splash in ocean water: cannonball hitting the sea, large water impact with spray, single splash`

### sfx/steel_clash (1s target)
- prompt: `cutlass swords clashing: sharp metallic ring of steel on steel, pirate boarding combat, single hit, bright`

### sfx/crew_cry_battle (2s target)
- prompt: `distant pirate crew battle cries: rough male voices shouting during a boarding action, group yell, no words, exterior ship deck`

### sfx/ocean_calm_bed (120s target)
- prompt: `calm open ocean ambience: gentle waves lapping against a wooden ship hull, soft wind, occasional distant gull, peaceful seamless ambience bed, no music`

### sfx/ocean_storm_bed (120s target)
- prompt: `stormy sea ambience: powerful waves crashing, howling wind, straining ship timbers in the distance, heavy weather at sea, seamless ambience bed, no music`

### sfx/harbor_bell (3s target)
- prompt: `harbor bell ringing twice across water: brass ship bell with natural decay, calm port atmosphere`

### sfx/coin_reward (1s target)
- prompt: `gold coins pouring onto wooden table: bright metallic coin cascade, treasure reward, satisfying pirate loot sound`

### music/explore_cue_a (120s)
- prompt: `adventurous orchestral sea exploration music: sweeping strings and gentle brass, optimistic seafaring journey, cinematic, no vocals, moderate tempo, loopable`

### music/explore_cue_b (120s)
- prompt: `adventurous orchestral sea exploration music: sweeping strings and gentle brass, optimistic seafaring journey, cinematic, no vocals, variation with more prominent solo fiddle and accordion, loopable`

### music/battle_cue_low (120s)
- prompt: `naval battle tension music, low intensity: ominous low strings and sparse war drums, danger approaching, cinematic orchestral, no vocals, restrained`

### music/battle_cue_high (120s)
- prompt: `naval battle music, high intensity: pounding war drums, aggressive brass stabs, driving string ostinato, epic cinematic pirate combat, no vocals, intense`

### music/victory_stinger (10s)
- prompt: `triumphant orchestral victory fanfare: bright brass fanfare with orchestral swell, pirate adventure victory, short triumphant resolution, no vocals`

### music/defeat_stinger (10s)
- prompt: `somber orchestral defeat sting: low mournful strings and a final timpani, quiet tragic loss at sea, no vocals`

## Integration design — how this bank is meant to be played

**Cannons are a layer system, not a sound.** A broadside is composed at runtime:
`cannon_boom_sub` (low body) + `cannon_crack_body` (the crack) + `cannon_echo_water`
(the tail over water). Fire them per-cannon with 30–80ms stagger across the
broadside — a 7-gun broadside should be 7 staggered composites, not one big
sample. Scale layer count/volume with broadside size. `cannon_distant` is for
enemy fire beyond the fog or across the map — low-pass it further with distance.

**A creaking ship is a living ship.** `hull_creak` variants should fire as
sparse random one-shots (every 20–60s, randomized) over the ocean bed *at all
times*, more often when the ship is heeling or damaged. `ocean_calm_bed` /
`ocean_storm_bed` crossfade with weather state — they are 120s beds, alternate
or crossfade at loop points.

**Music is intensity-tiered** (the API had no stems, so tiers replace stem
fading): `explore_cue_a/b` alternate during sailing; on combat entry crossfade
to `battle_cue_low`; as hull damage or crew loss rises, crossfade to
`battle_cue_high`. `victory_stinger` / `defeat_stinger` on resolution.

Other mappings: `wood_splinter_debris` + `hull_impact` on taking hits;
`splash` for near-miss cannonballs; `steel_clash` + `crew_cry_battle` for
boarding; `rigging_strain`/`sail_flap` on hard maneuvers; `harbor_bell` in
port; `coin_reward` for plunder.

## Provenance & license

- Generated 2026-11-26 under the Sonilo Pro trial on the papaandthejimjams@gmail.com account.
- Full generation records (task JSON with timestamps, prompts, file ids) are archived in the
  `sonilo-audio-pipeline` repository under `out/provenance/tasks/` — keep them as license evidence.
- Original m4a masters + normalized wav masters live in `sonilo-audio-pipeline/out/pir8/`.
- Sonilo's license grants commercial use for assets generated on a paid plan; the Pro trial was an active paid-tier plan at generation time.
