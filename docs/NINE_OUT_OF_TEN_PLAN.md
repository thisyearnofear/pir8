# PIR8 9/10 Product Plan

## Goal

Move PIR8 from a strong prototype to a production-grade 9/10 product across:

- Product design
- UI/UX
- System architecture
- Game design

Current review baseline:

- Product design: 8/10
- UI/UX: 7/10
- System architecture: 6/10
- Game design: 7/10
- Overall: 7/10

Target:

- Product design: 9/10
- UI/UX: 9/10
- System architecture: 9/10
- Game design: 9/10
- Overall: 9/10

## Strategic Principle

PIR8 becomes excellent when privacy is enforced by the game, not only described by the interface.

The winning product loop is:

1. Start instantly.
2. Scout uncertain waters.
3. Commit under incomplete information.
4. Reveal an ambush or mistake.
5. Share or accept a challenge.
6. Convert into ranked on-chain competition.

## Track 1: Rule-Level Hidden Information

Status: In progress. Initial visibility projection and board integration completed.

### Problem

Fog of war currently reads as a UI treatment more than a rule-level mechanic. Enemy ships can still appear before scan/reveal rules fully justify visibility.

### Work

- Add a canonical visibility engine that answers:
  - Which coordinates a player can see.
  - Which ships are visible to that player.
  - Which territory details are known, unknown, or stale.
  - Which events are public versus private.
- Update `PirateMap` to render from a player-specific visible-state projection, not raw full game state.
- Hide enemy ships outside visible coordinates.
- Represent stale intel separately from current scans.
- Ensure spectator mode has its own visibility rules:
  - Public spectator can see revealed/public state.
  - Replay spectator can see full state only when replay mode explicitly allows it.
- Add tests for:
  - Enemy ship outside scan range is hidden.
  - Enemy ship inside scan range is visible.
  - Moved enemy ship leaves stale intel, not live position.
  - Attack reveal produces a public event.

### Acceptance Criteria

- A player cannot infer hidden enemy ship positions from DOM, UI labels, damage previews, tooltips, or board overlays. Initial board projection completed.
- Fog behavior is covered by unit tests. Initial projection tests completed.
- The board can explain current, hidden, and stale information without extra tutorial copy.

### Completed Work

- Added `buildVisibilityProjection` as a canonical player-specific visibility projection.
- Updated `PirateMap` to use projected ships for rendering, selection, threat zones, and damage previews.
- Added stale-sector styling distinct from current scanned sectors and hidden fog sectors.
- Added unit tests for hidden enemy ships, scanned enemy visibility, stale intel, and explicit omniscient spectator mode.

### Rating Impact

- Game design: +1.0
- UI/UX: +0.5
- Product design: +0.5

## Track 2: Real Challenge Acceptance And Settlement

### Problem

Challenge Action acceptance currently creates a signable intent receipt, but it does not yet construct the canonical join, spectate, or challenge transaction.

### Work

- Define a challenge record model:
  - Challenge id
  - Creator wallet or guest id
  - Game id or seed state
  - Referrer
  - Status: open, accepted, started, completed, expired
  - Created, accepted, and completed timestamps
- Add durable storage for challenge records.
- Replace memo-only Action POST with the correct next step per challenge type:
  - `shadow-skirmish`: create a local/practice challenge receipt.
  - `duel`: build or initiate a join transaction.
  - `watch`: open spectate intent without pretending to join.
- Record acceptance only after the client signs or submits the transaction.
- Add canonical post-transaction refresh:
  - Fetch game state after create/join/start/action.
  - Reconcile local state with on-chain/indexed state.
- Add failure states:
  - Challenge expired.
  - Lobby full.
  - Wallet not eligible.
  - Transaction rejected.

### Acceptance Criteria

- A challenge link can be opened, accepted, and resolved into a real game/spectate flow.
- Referrer attribution survives acceptance.
- The UI never claims a user joined before the transaction or accepted state is confirmed.
- Action endpoints return valid Action responses for success and failure paths.

### Rating Impact

- Product design: +0.5
- System architecture: +1.0
- UI/UX: +0.5

## Track 3: Honest Competitive Platform Data

Status: In progress. Data provenance labels completed for the current competitive hub.

### Problem

Competitive surfaces currently have seeded fallback data. That is useful for demos but can feel misleading if presented as live ranked data.

### Work

- Add a competitive data source boundary:
  - Queue status
  - Captain profiles
  - Bounties
  - Match history
  - Accepted challenges
  - Rank changes
- Clearly mark data provenance:
  - Live
  - Testnet
  - Preview
  - Seeded demo
- Replace static bounties with stored bounty records:
  - Target captain
  - Creator
  - Stake amount
  - Conditions
  - Status
  - Claimed by
- Replace static captain profiles with computed stats:
  - Wins/losses
  - Win rate
  - Preferred style
  - Streaks
  - Recent match receipts
- Add empty/loading/error states to the competitive hub.
- Add an admin or script path to seed demo data explicitly for test environments.

### Acceptance Criteria

- Users can tell whether competitive data is live, testnet, or preview. Initial provenance labels completed.
- Bounty board and captain profiles are fetched from a real API boundary.
- Empty states do not imply fake activity.
- Data loading does not break the first-screen experience.

### Completed Work

- Added competitive snapshot provenance: `live`, `testnet`, `preview`, or `seeded`.
- Added loading, fallback, and provenance labels to the competitive hub.
- Kept seeded data clearly identifiable instead of silently presenting it as live ranked activity.

### Rating Impact

- UI/UX: +0.75
- Product design: +0.5
- System architecture: +0.5

## Track 4: Architecture Split Completion

### Problem

`GameShell` still coordinates too much: entry flow, practice, AI battle, on-chain actions, privacy simulation, viral moments, modals, spectator state, and route-query handling.

### Work

- Split `GameShell` into:
  - `EntryController`
  - `MatchController`
  - `PracticeController`
  - `SpectatorController`
  - `ChallengeController`
  - `ModalLayer`
  - `NotificationLayer`
- Move query-param handling into `ChallengeController`.
- Move practice/AI flow into `PracticeController`.
- Move on-chain lifecycle into `MatchController`.
- Convert broad store selectors into focused selectors:
  - Match state selector
  - Player selector
  - Visibility selector
  - Action selector
  - Notification selector
- Remove hook dependency warnings by stabilizing callbacks with `useCallback` or moving effects into controllers.
- Add integration tests for:
  - Shared challenge URL routing.
  - Practice start.
  - AI battle start.
  - On-chain create/join happy path with mocked wallet.

### Acceptance Criteria

- `GameShell` becomes a small route/state composition component.
- No lint hook dependency warnings.
- Each controller has one clear responsibility.
- Tests cover the main route-to-action flows.

### Rating Impact

- System architecture: +1.5
- UI/UX: +0.25

## Track 5: Battle Moment Replays

### Problem

Share copy now uses deterministic battle moment data, but there is not yet a replayable turn artifact users can watch or share.

### Work

- Define a battle moment schema:
  - Moment id
  - Game id
  - Turn number
  - Acting player
  - Before snapshot
  - After snapshot
  - Public event list
  - Reveal metadata
  - Share title and summary
- Capture battle moments on:
  - First blood
  - Ambush reveal
  - High-damage attack
  - Territory swing
  - Comeback win
  - Bounty claim
- Add `/api/moments/:id` or equivalent route.
- Add a replay view that can animate:
  - Scan/reveal
  - Movement
  - Attack
  - Damage
  - Territory capture
- Generate share links to the replay, not only to a generic challenge.

### Acceptance Criteria

- A completed match can produce at least one shareable replay moment.
- Shared moment links open a watchable state without wallet connection.
- Replay state does not leak private information beyond the selected moment.

### Rating Impact

- Product design: +0.75
- UI/UX: +0.75
- Game design: +0.5

## Track 6: Tactical UX Polish

### Problem

The board is much clearer, but it still needs the last 20 percent of interaction clarity expected from a tactical game.

### Work

- Add command previews:
  - Move path
  - Attack arc
  - Expected damage range
  - Reveal consequence
  - Enemy-visible consequence
- Add confirmation states for high-impact moves.
- Add accessible labels for:
  - Ship class
  - Health
  - Visibility state
  - Threat state
  - Territory control
- Add mobile-specific board QA:
  - Tap target sizing
  - No text overlap
  - No action panels covering selected cells
  - Clear selected/available/invalid states
- Add empty, loading, disabled, and error states for all competitive and challenge surfaces.

### Acceptance Criteria

- A new user can select a ship and understand legal moves, threats, and attack outcomes without reading documentation.
- Mobile board interactions remain usable on small screens.
- No visible layout overlap in primary flows.

### Rating Impact

- UI/UX: +1.0
- Game design: +0.25

## Track 7: Game Balance And Fun Validation

### Problem

The target game loop is strong, but the match pacing and tactical choices need validation through tests, simulations, and play sessions.

### Work

- Add simulation tests for:
  - Average duel length.
  - First contact turn.
  - Average scan usage.
  - Ship survival rates.
  - Territory capture pacing.
- Tune toward:
  - 5-8 minute duels.
  - Meaningful scan scarcity.
  - At least one reveal/ambush moment per normal match.
  - No dominant single opening.
- Add difficulty profiles for AI:
  - Novice explains mechanics.
  - Pirate makes reasonable tactical choices.
  - Captain pressures scouting mistakes.
  - Admiral exploits poor visibility management.
- Run structured playtest notes:
  - Confusing moment.
  - Best moment.
  - Reason for loss.
  - Whether user wants rematch.

### Acceptance Criteria

- Simulated and human-played duels regularly land in the 5-8 minute target.
- Scouting choices affect outcomes.
- Players can describe why they won or lost.
- The game creates share-worthy reveal moments without forcing them.

### Rating Impact

- Game design: +1.25
- Product design: +0.25

## Recommended Sequence

### Milestone 1: Trust The Game State

1. Rule-level hidden information.
2. Tactical UX polish for visibility states.
3. Tests for visibility and board rendering.

This makes the product thesis true.

### Milestone 2: Trust The Challenge Loop

1. Durable challenge records. ✅
2. Real acceptance/join flow. In progress.
3. Canonical post-transaction refresh. ✅
4. Honest failure states. ✅

Progress so far:
- Canonical `challengeRecords` now back the competitive store with lifecycle statuses.
- Shared challenge Actions now create preview intent records instead of claiming acceptance immediately.
- A dedicated `/api/challenges` route exists for challenge lookup, filtering, and status updates.
- The app now resolves incoming shared links through canonical challenge records when `challengeId` is present.

This makes sharing and conversion materially more real, even though full transaction-confirmed duel settlement still remains.

### Milestone 3: Trust The Competitive Surface

1. Live/testnet/preview data provenance. ✅ preview/seeded distinction shipped.
2. Stored bounties and captain profiles. Partial.
3. Rank and match receipt updates. Not yet complete.

Progress so far:
- Competitive snapshot provenance is now derived from durable challenge-backed records instead of static assumptions.
- The competitive UI now surfaces open and accepted challenge counts from canonical records.

This makes competition more credible, but not fully production-truthful yet.

### Milestone 4: Trust The Codebase

1. Finish controller split. In progress.
2. Tighten selectors. Partial.
3. Remove hook warnings. In progress.
4. Add integration tests. Not yet complete.

Progress so far:
- Incoming challenge handling moved into `useIncomingChallenge`.
- Practice/AI orchestration moved into `usePracticeModeController`.
- Match create/join/lobby/resource flows moved into `useMatchFlowController`.
- `GameShell` is slimmer and has fewer hook warnings than before, though the split is not finished.

This is making the system maintainable, but the decomposition is not complete yet.

### Milestone 5: Trust The Fun

1. Replayable battle moments. In progress.
2. Simulation balance tests. Not yet complete.
3. Playtest loop. Not yet complete.
4. Tune match pacing. Not yet complete.

Progress so far:
- Battle moments can now be persisted through a reusable replay persistence hook on match completion.
- Victory/share flow now prefers replay URLs when persistence succeeds and falls back gracefully otherwise.
- Replay infrastructure exists across `/api/moments`, `/api/moments/[id]`, and `/replay/[id]`, but the replay artifact itself still needs richer before/after public-state reconstruction.

This creates a real replay backbone, but not the full 9/10 replay experience yet.

## Definition Of 9/10

PIR8 reaches 9/10 when all of the following are true:

- Hidden information is enforced by the engine and visible through the UI.
- A challenge link can become a real accepted duel or spectate flow.
- Competitive data is truthful, durable, and clearly labeled.
- The main app shell is split into focused controllers.
- No hook dependency lint warnings remain.
- The board is understandable on desktop and mobile.
- A completed match can produce a watchable battle moment.
- Short duels consistently land near the 5-8 minute target.
- The product can be explained in one sentence and felt in the first minute:

> Scout hidden waters, mask your fleet, spring the ambush, and challenge the next captain.
