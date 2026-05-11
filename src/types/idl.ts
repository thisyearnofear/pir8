/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pir8_game.json`.
 */
export type Pir8Game = {
  "address": "B8iZB76A6umsmc9Ctc8psmtAZhzxgAEP41uoAsyU2mrC",
  "metadata": {
    "name": "pir8Game",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "PIR8 - Privacy-First Gaming on Solana"
  },
  "instructions": [
    {
      "name": "activateGhostFleet",
      "discriminator": [
        170,
        39,
        1,
        36,
        40,
        198,
        85,
        247
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "attackShip",
      "discriminator": [
        163,
        146,
        122,
        23,
        170,
        146,
        60,
        216
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "attackerShipId",
          "type": "string"
        },
        {
          "name": "targetShipId",
          "type": "string"
        }
      ]
    },
    {
      "name": "buildShip",
      "discriminator": [
        213,
        16,
        198,
        123,
        106,
        214,
        120,
        157
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "shipType",
          "type": {
            "defined": {
              "name": "shipType"
            }
          }
        },
        {
          "name": "portX",
          "type": "u8"
        },
        {
          "name": "portY",
          "type": "u8"
        }
      ]
    },
    {
      "name": "checkAndCompleteGame",
      "discriminator": [
        246,
        228,
        111,
        150,
        184,
        101,
        136,
        240
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimTerritory",
      "discriminator": [
        187,
        166,
        174,
        42,
        9,
        148,
        254,
        52
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "shipId",
          "type": "string"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "collectResources",
      "discriminator": [
        80,
        180,
        84,
        6,
        25,
        165,
        77,
        252
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        },
        {
          "name": "mode",
          "type": {
            "defined": {
              "name": "gameMode"
            }
          }
        }
      ]
    },
    {
      "name": "delegateAgentControl",
      "discriminator": [
        144,
        153,
        218,
        134,
        16,
        66,
        148,
        153
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "agent"
          ]
        }
      ],
      "args": [
        {
          "name": "delegate",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "endTurn",
      "discriminator": [
        34,
        247,
        56,
        118,
        182,
        41,
        186,
        237
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinGameViaDelegate",
      "discriminator": [
        4,
        233,
        184,
        169,
        1,
        230,
        94,
        195
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "sessionKey",
          "docs": [
            "Session key acting as signer - must be delegate of the owner"
          ],
          "signer": true
        },
        {
          "name": "agent",
          "docs": [
            "The original owner who set the delegate - used to derive AgentRegistry PDA"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "relations": [
            "agent"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "moveShip",
      "discriminator": [
        85,
        196,
        190,
        46,
        231,
        131,
        247,
        32
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "shipId",
          "type": "string"
        },
        {
          "name": "toX",
          "type": "u8"
        },
        {
          "name": "toY",
          "type": "u8"
        },
        {
          "name": "decisionTimeMs",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "moveShipViaDelegate",
      "discriminator": [
        5,
        178,
        241,
        20,
        11,
        188,
        98,
        124
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "sessionKey",
          "docs": [
            "Session key acting as signer - must be delegate of the owner"
          ],
          "signer": true
        },
        {
          "name": "agent",
          "docs": [
            "The original owner who set the delegate - used to derive AgentRegistry PDA"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "relations": [
            "agent"
          ]
        }
      ],
      "args": [
        {
          "name": "shipId",
          "type": "string"
        },
        {
          "name": "toX",
          "type": "u8"
        },
        {
          "name": "toY",
          "type": "u8"
        },
        {
          "name": "decisionTimeMs",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "registerAgent",
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "version",
          "type": "string"
        },
        {
          "name": "twitter",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "website",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "resetGame",
      "discriminator": [
        97,
        146,
        71,
        156,
        110,
        206,
        124,
        224
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "game"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "scanCoordinate",
      "discriminator": [
        225,
        142,
        171,
        176,
        29,
        89,
        195,
        255
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "coordinateX",
          "type": "u8"
        },
        {
          "name": "coordinateY",
          "type": "u8"
        }
      ]
    },
    {
      "name": "startGame",
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  105,
                  114,
                  97,
                  116,
                  101,
                  95,
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_id",
                "account": "pirateGame"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "game"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "agentRegistry",
      "discriminator": [
        6,
        34,
        128,
        124,
        33,
        136,
        199,
        171
      ]
    },
    {
      "name": "pirateGame",
      "discriminator": [
        241,
        180,
        238,
        245,
        94,
        66,
        115,
        85
      ]
    }
  ],
  "events": [
    {
      "name": "coordinateScanned",
      "discriminator": [
        137,
        65,
        31,
        191,
        3,
        6,
        252,
        232
      ]
    },
    {
      "name": "gameCompleted",
      "discriminator": [
        103,
        26,
        106,
        108,
        240,
        191,
        179,
        120
      ]
    },
    {
      "name": "gameStarted",
      "discriminator": [
        222,
        247,
        78,
        255,
        61,
        184,
        156,
        41
      ]
    },
    {
      "name": "ghostFleetActivated",
      "discriminator": [
        93,
        105,
        124,
        62,
        37,
        137,
        190,
        30
      ]
    },
    {
      "name": "moveExecuted",
      "discriminator": [
        220,
        142,
        168,
        169,
        147,
        29,
        80,
        82
      ]
    },
    {
      "name": "playerJoined",
      "discriminator": [
        39,
        144,
        49,
        106,
        108,
        210,
        183,
        38
      ]
    },
    {
      "name": "resourcesCollected",
      "discriminator": [
        177,
        8,
        81,
        108,
        255,
        30,
        112,
        122
      ]
    },
    {
      "name": "shipAttacked",
      "discriminator": [
        92,
        240,
        188,
        156,
        131,
        235,
        148,
        13
      ]
    },
    {
      "name": "shipBuilt",
      "discriminator": [
        211,
        172,
        85,
        255,
        48,
        45,
        168,
        38
      ]
    },
    {
      "name": "shipMoved",
      "discriminator": [
        154,
        13,
        86,
        46,
        37,
        189,
        4,
        72
      ]
    },
    {
      "name": "territoryClaimed",
      "discriminator": [
        121,
        234,
        16,
        184,
        57,
        40,
        162,
        201
      ]
    },
    {
      "name": "winningsClaimed",
      "discriminator": [
        187,
        184,
        29,
        196,
        54,
        117,
        70,
        150
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameNotActive",
      "msg": "Game is not active"
    },
    {
      "code": 6001,
      "name": "gameFull",
      "msg": "Game is full"
    },
    {
      "code": 6002,
      "name": "notEnoughPlayers",
      "msg": "Not enough players to start"
    },
    {
      "code": 6003,
      "name": "gameAlreadyStarted",
      "msg": "Game already started"
    },
    {
      "code": 6004,
      "name": "notPlayerTurn",
      "msg": "Not your turn"
    },
    {
      "code": 6005,
      "name": "shipNotFound",
      "msg": "Ship not found"
    },
    {
      "code": 6006,
      "name": "shipNotAtLocation",
      "msg": "Ship not at specified location"
    },
    {
      "code": 6007,
      "name": "territoryNotControlled",
      "msg": "Territory not controlled by player"
    },
    {
      "code": 6008,
      "name": "insufficientResources",
      "msg": "Insufficient resources"
    },
    {
      "code": 6009,
      "name": "fleetSizeLimit",
      "msg": "Fleet size limit reached"
    },
    {
      "code": 6010,
      "name": "noAdjacentPort",
      "msg": "No adjacent controlled port"
    },
    {
      "code": 6011,
      "name": "positionOccupied",
      "msg": "Position occupied"
    },
    {
      "code": 6012,
      "name": "gameNotJoinable",
      "msg": "Game not joinable"
    },
    {
      "code": 6013,
      "name": "invalidCoordinate",
      "msg": "Invalid coordinate"
    },
    {
      "code": 6014,
      "name": "shipsNotInRange",
      "msg": "Ships not in range"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6016,
      "name": "noScansRemaining",
      "msg": "No scan charges remaining"
    },
    {
      "code": 6017,
      "name": "coordinateAlreadyScanned",
      "msg": "Coordinate already scanned"
    },
    {
      "code": 6018,
      "name": "unauthorizedDelegate",
      "msg": "Session key is not an authorized delegate"
    },
    {
      "code": 6019,
      "name": "ghostFleetAlreadyActive",
      "msg": "Ghost Fleet is already active"
    }
  ],
  "types": [
    {
      "name": "agentRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "delegate",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "version",
            "type": "string"
          },
          {
            "name": "twitter",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "website",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "gamesPlayed",
            "type": "u64"
          },
          {
            "name": "wins",
            "type": "u64"
          },
          {
            "name": "lastActive",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "coordinateScanned",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "coordinateX",
            "type": "u8"
          },
          {
            "name": "coordinateY",
            "type": "u8"
          },
          {
            "name": "tileType",
            "type": "string"
          },
          {
            "name": "scanChargesRemaining",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameCompleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "victoryType",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "gameMode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "casual"
          },
          {
            "name": "competitive"
          },
          {
            "name": "agentArena"
          }
        ]
      }
    },
    {
      "name": "gameStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "playerCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waiting"
          },
          {
            "name": "active"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "ghostFleetActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "turnsRemaining",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "moveExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "decisionTimeMs",
            "type": "u64"
          },
          {
            "name": "speedBonusAwarded",
            "type": "u64"
          },
          {
            "name": "newTotalScore",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pirateGame",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "gameStatus"
              }
            }
          },
          {
            "name": "mode",
            "type": {
              "defined": {
                "name": "gameMode"
              }
            }
          },
          {
            "name": "playerCount",
            "type": "u8"
          },
          {
            "name": "currentPlayerIndex",
            "type": "u8"
          },
          {
            "name": "turnNumber",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "startedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "completedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "weatherType",
            "type": {
              "defined": {
                "name": "weatherType"
              }
            }
          },
          {
            "name": "weatherDuration",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "players",
            "type": {
              "vec": {
                "defined": {
                  "name": "playerData"
                }
              }
            }
          },
          {
            "name": "territoryMap",
            "type": {
              "vec": {
                "defined": {
                  "name": "territoryCell"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "playerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "resources",
            "type": {
              "defined": {
                "name": "resources"
              }
            }
          },
          {
            "name": "ships",
            "type": {
              "vec": {
                "defined": {
                  "name": "shipData"
                }
              }
            }
          },
          {
            "name": "controlledTerritories",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "totalScore",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "scanCharges",
            "type": "u8"
          },
          {
            "name": "scannedCoordinates",
            "type": "bytes"
          },
          {
            "name": "isGhostFleet",
            "type": "bool"
          },
          {
            "name": "ghostFleetTurnsRemaining",
            "type": "u8"
          },
          {
            "name": "totalGhostsActivated",
            "type": "u8"
          },
          {
            "name": "speedBonusAccumulated",
            "type": "u64"
          },
          {
            "name": "averageDecisionTimeMs",
            "type": "u64"
          },
          {
            "name": "totalMoves",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerJoined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "playerCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "resources",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gold",
            "type": "u32"
          },
          {
            "name": "crew",
            "type": "u32"
          },
          {
            "name": "cannons",
            "type": "u32"
          },
          {
            "name": "supplies",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "resourcesCollected",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "goldCollected",
            "type": "u32"
          },
          {
            "name": "crewCollected",
            "type": "u32"
          },
          {
            "name": "suppliesCollected",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "shipAttacked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "attackerShipId",
            "type": "string"
          },
          {
            "name": "targetShipId",
            "type": "string"
          },
          {
            "name": "damage",
            "type": "u32"
          },
          {
            "name": "shipDestroyed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "shipBuilt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "shipType",
            "type": {
              "defined": {
                "name": "shipType"
              }
            }
          },
          {
            "name": "positionX",
            "type": "u8"
          },
          {
            "name": "positionY",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "shipData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "shipType",
            "type": {
              "defined": {
                "name": "shipType"
              }
            }
          },
          {
            "name": "health",
            "type": "u32"
          },
          {
            "name": "maxHealth",
            "type": "u32"
          },
          {
            "name": "attack",
            "type": "u32"
          },
          {
            "name": "defense",
            "type": "u32"
          },
          {
            "name": "speed",
            "type": "u32"
          },
          {
            "name": "positionX",
            "type": "u8"
          },
          {
            "name": "positionY",
            "type": "u8"
          },
          {
            "name": "lastActionTurn",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "shipMoved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "shipId",
            "type": "string"
          },
          {
            "name": "fromX",
            "type": "u8"
          },
          {
            "name": "fromY",
            "type": "u8"
          },
          {
            "name": "toX",
            "type": "u8"
          },
          {
            "name": "toY",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "shipType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sloop"
          },
          {
            "name": "frigate"
          },
          {
            "name": "galleon"
          },
          {
            "name": "flagship"
          }
        ]
      }
    },
    {
      "name": "territoryCell",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cellType",
            "type": {
              "defined": {
                "name": "territoryCellType"
              }
            }
          },
          {
            "name": "owner",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "territoryCellType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "water"
          },
          {
            "name": "island"
          },
          {
            "name": "port"
          },
          {
            "name": "treasure"
          },
          {
            "name": "storm"
          },
          {
            "name": "reef"
          },
          {
            "name": "whirlpool"
          }
        ]
      }
    },
    {
      "name": "territoryClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "territoryX",
            "type": "u8"
          },
          {
            "name": "territoryY",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "weatherType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "calm"
          },
          {
            "name": "tradeWinds"
          },
          {
            "name": "storm"
          },
          {
            "name": "fog"
          }
        ]
      }
    },
    {
      "name": "winningsClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
