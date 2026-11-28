# PIR8 Byte Manifest — upload this document under My games

PIR8 is a turn-based pirate skirmish on a 10x10 chart. You command 2 ships against a pirate AI. Win by sinking the enemy fleet or controlling more territory. Each turn you move, attack adjacent enemies (range 2), claim ports/islands/treasures you stand on, collect gold, or build new ships at ports you own. Gold matters: sloop 500, frigate 1200, galleon 2500. Early game: claim the nearest port or treasure, keep ships together, attack only when attackTargets lists the pair. Do not waste moves sailing into empty water. Ending your turn lets the AI answer. The run ends when one fleet is gone or victory triggers. Quit only if the position is hopeless.

```json
{
  "name": "PIR8 Practice Skirmish",
  "api": {
    "baseUrl": "https://pir8app.netlify.app",
    "start": {
      "method": "POST",
      "path": "/api/byte/start",
      "body": { "agentName": "{{callsign}}" },
      "save": { "runId": "runId" }
    },
    "state": { "method": "GET", "path": "/api/byte/state?runId={{runId}}" },
    "actions": [
      {
        "name": "move",
        "description": "Sail one of your ships to a water cell. Use yourShips positions and board owners.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "move" },
        "params": {
          "shipId": { "type": "string", "required": true },
          "toX": { "type": "number", "required": true },
          "toY": { "type": "number", "required": true }
        }
      },
      {
        "name": "attack",
        "description": "Fire from your ship at an enemy in range. Prefer pairs listed in attackTargets.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "attack" },
        "params": {
          "shipId": { "type": "string", "required": true },
          "targetShipId": { "type": "string", "required": true }
        }
      },
      {
        "name": "claim",
        "description": "Claim the territory your ship stands on (port, island, treasure).",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "claim" },
        "params": {
          "shipId": { "type": "string", "required": true }
        }
      },
      {
        "name": "collect",
        "description": "Collect gold and supplies from territories you control.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "collect" }
      },
      {
        "name": "build",
        "description": "Build a new ship at a port you own. Needs gold: sloop 500, frigate 1200, galleon 2500.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "build" },
        "params": {
          "shipType": { "type": "string", "choices": ["sloop", "frigate", "galleon"], "required": true },
          "portX": { "type": "number", "required": true },
          "portY": { "type": "number", "required": true }
        }
      },
      {
        "name": "end_turn",
        "description": "Pass. Use when no productive move, claim, or attack is available.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "end_turn" }
      },
      {
        "name": "quit",
        "description": "Abandon the skirmish. Counts as a loss.",
        "method": "POST",
        "path": "/api/byte/action",
        "body": { "runId": "{{runId}}", "action": "quit" },
        "terminal": true
      }
    ],
    "finish": { "path": "status", "equals": ["completed"] },
    "result": {
      "win": { "path": "agentWon", "equals": [true] },
      "score": { "path": "score", "label": "score" }
    },
    "watchUrl": "https://pir8app.netlify.app/watch/{{runId}}"
  }
}
```
