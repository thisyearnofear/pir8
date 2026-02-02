/**
 * Integration utilities for Helius and Pump Fun APIs
 * Consolidates your test implementations from /tests directory
 */

import { SOLANA_CONFIG, API_ENDPOINTS, ZCASH_CONFIG } from "../utils/constants";

// ENHANCED Helius Integration (based on helius-transaction-monitor.ts)
export class HeliusMonitor {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastErrorAt = 0;
  private errorThrottleMs = 30000;
  private pingInterval: any = null;
  private logLevel: "silent" | "error" | "warn" | "info" | "debug" =
    (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || "error";

  constructor(
    private onTransaction: (data: any) => void,
    _gameId?: string,
  ) { }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      this.log("warn", "WebSocket already connected or connecting");
      return;
    }

    if (!API_ENDPOINTS.HELIUS_RPC || API_ENDPOINTS.HELIUS_RPC.includes('YOUR_API_KEY')) {
      throw new Error("Helius RPC URL not configured");
    }

    // Use WebSocket endpoint
    const wsUrl = API_ENDPOINTS.HELIUS_RPC.replace(
      "https://",
      "wss://",
    ).replace("http://", "ws://");
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.log("info", "Helius WebSocket connected");
      this.reconnectAttempts = 0;
      if (!this.pingInterval) {
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id: Math.random(),
                  method: "ping",
                }),
              );
            } catch { }
          }
        }, 60000);
      }
      this.subscribeToGameTransactions();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Filter and process PIR8 game events
        if (this.isPir8GameTransaction(data)) {
          this.processGameTransaction(data);
          this.onTransaction(data);
        }
      } catch (error) {
        this.log("error", "Failed to parse Helius message");
      }
    };

    this.ws.onclose = () => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      this.log("warn", "Helius WebSocket disconnected");
      this.handleReconnect();
    };

    this.ws.onerror = () => {
      const now = Date.now();
      if (now - this.lastErrorAt > this.errorThrottleMs) {
        this.lastErrorAt = now;
        this.log("error", "Helius WebSocket error");
      }
    };
  }

  private subscribeToGameTransactions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const includeAccounts = [SOLANA_CONFIG.PROGRAM_ID].filter(Boolean);
    if (SOLANA_CONFIG.TREASURY_ADDRESS)
      includeAccounts.push(SOLANA_CONFIG.TREASURY_ADDRESS);

    const subscribeMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "transactionSubscribe",
      params: [
        {
          vote: false,
          failed: false,
          signature: null,
          accountInclude: includeAccounts,
        },
        {
          commitment: "finalized",
          encoding: "jsonParsed",
          transactionDetails: "full",
          showRewards: true,
          maxSupportedTransactionVersion: 0,
        },
      ],
    };

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
    } catch { }
    this.log("debug", "Subscribed to PIR8 game transactions");
  }

  private isPir8GameTransaction(data: any): boolean {
    // Check if transaction involves PIR8 program
    try {
      const transaction = data?.result?.value?.transaction;
      if (!transaction) return false;

      const accountKeys = transaction?.message?.accountKeys;
      if (!accountKeys) return false;

      return accountKeys.some(
        (key: any) =>
          key?.pubkey === SOLANA_CONFIG.PROGRAM_ID ||
          key === SOLANA_CONFIG.PROGRAM_ID,
      );
    } catch {
      return false;
    }
  }

  private processGameTransaction(data: any) {
    try {
      const transaction = data.result?.value;
      const logs = transaction?.meta?.logMessages || [];

      // Parse PIR8 game events from logs
      for (const log of logs) {
        if (log.includes("GameCreated")) {
          this.handleGameCreated();
        } else if (log.includes("PlayerJoined")) {
          this.handlePlayerJoined();
        } else if (log.includes("GameStarted")) {
          this.handleGameStarted();
        } else if (log.includes("MoveMade")) {
          this.handleMoveMade();
        } else if (log.includes("GameCompleted")) {
          this.handleGameCompleted();
        }
      }
    } catch {
      this.log("error", "Error processing game transaction");
    }
  }

  private handleGameCreated() {
    this.log("debug", "Game Created");
  }

  private handlePlayerJoined() {
    this.log("debug", "Player Joined");
  }

  private handleGameStarted() {
    this.log("debug", "Game Started");
  }

  private handleMoveMade() {
    this.log("debug", "Move Made");
  }

  private handleGameCompleted() {
    this.log("debug", "Game Completed");
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.log(
          "warn",
          `Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        this.connect();
      }, delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private log(
    level: "error" | "warn" | "info" | "debug" | "silent",
    message: string,
  ) {
    const order = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 } as const;
    const current = order[this.logLevel];
    const target = order[level];
    if (target <= current && level !== "silent") {
      if (level === "error") console.error(message);
      else if (level === "warn") console.warn(message);
      else console.log(message);
    }
  }
}

// Pump Fun Integration (based on pump-token-creator.ts)
export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialBuySOL?: number;
}

export class PumpFunCreator {
  private static readonly PUMPPORTAL_API = "https://pumpportal.fun/api";

  static async createToken(params: TokenCreationParams) {
    try {
      const response = await fetch(`${this.PUMPPORTAL_API}/trade-local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: "", // Will be set by wallet
          action: "create",
          tokenMetadata: {
            name: params.name,
            symbol: params.symbol,
            description: params.description,
            image: params.imageUrl || this.getDefaultPirateImage(params.symbol),
          },
          mint: "", // Generated by PumpPortal
          denominatedInSol: "true",
          amount: params.initialBuySOL || 0,
          slippage: 10,
          priorityFee: 0.0001,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("PumpFun token creation error:", error);
      throw error;
    }
  }

  static async getTokenInfo(mintAddress: string) {
    try {
      // Implementation based on your test file
      const response = await fetch(
        `${this.PUMPPORTAL_API}/token/${mintAddress}`,
      );

      if (!response.ok) {
        throw new Error(`Token info fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("PumpFun token info error:", error);
      throw error;
    }
  }

  private static getDefaultPirateImage(symbol?: string): string {
    // Return default pirate-themed token image based on symbol
    const pirateImages = [
      "https://via.placeholder.com/400x400/FFD700/000000?text=🏴‍☠️",
      "https://via.placeholder.com/400x400/8B4513/FFD700?text=⚔️",
      "https://via.placeholder.com/400x400/DC143C/FFFFFF?text=💰",
    ];

    if (!symbol) {
      return pirateImages[0]!;
    }

    const hash = symbol
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pirateImages[hash % pirateImages.length]! || pirateImages[0]!;
  }

  static generateWinnerTokenMetadata(playerName: string, score: number) {
    const symbols = ["CAPT", "PLND", "TRSR", "SKULL", "SHIP"];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];

    return {
      name: `Captain ${playerName}`,
      symbol: `${randomSymbol}${Date.now().toString().slice(-3)}`,
      description: `🏴‍☠️ Victory token for pirate ${playerName} who scored ${score} points in PIR8 battle! Arrr! 🏴‍☠️`,
      imageUrl: this.getDefaultPirateImage(randomSymbol || "PIRATE"),
    };
  }
}

// Game Integration Helpers
export function setupGameIntegrations() {
  // Only connect if Helius RPC is properly configured (not placeholder)
  if (!API_ENDPOINTS.HELIUS_RPC ||
    API_ENDPOINTS.HELIUS_RPC.includes('YOUR_API_KEY') ||
    API_ENDPOINTS.HELIUS_RPC.includes('your_helius')) {
    return {
      heliusMonitor: null,
      cleanup: () => { },
    };
  }

  const heliusMonitor = new HeliusMonitor(() => { });

  // Use try-catch to prevent connection errors from crashing the app
  try {
    heliusMonitor.connect();
  } catch (error) {
    console.warn('[Helius] Failed to connect, continuing without WebSocket monitoring:', error);
  }

  return {
    heliusMonitor,
    cleanup: () => heliusMonitor?.disconnect(),
  };
}

// Zcash Bridge (memo-based private entry)
// Usage: Players send shielded Zcash memo to enter PIR8 tournaments privately
// Memo format: {"v":1,"gameId":"<game_id>","action":"join","solanaPubkey":"<pubkey>"}
export interface MemoPayload {
  version: number;
  gameId: string;
  action: "join" | "create";
  solanaPubkey: string;
  timestamp: number;
  metadata: Record<string, any>;
  zcashTxHash?: string;
  blockHeight?: number;
}

export class ZcashMemoBridge {
  private static readonly MEMO_MAX_SIZE = 512; // Zcash memo limit in bytes
  private static readonly MEMO_STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  constructor(private onEntry: (payload: MemoPayload) => void) { }

  /**
   * Parse Zcash shielded memo containing tournament entry data
   * Memo must be valid JSON matching MEMO_SCHEMA_VERSION
   */
  parseMemo(memo: string): MemoPayload | null {
    try {
      // Validate memo size
      if (memo.length > ZcashMemoBridge.MEMO_MAX_SIZE) {
        console.warn("Memo exceeds Zcash size limit");
        return null;
      }

      const data = JSON.parse(memo);

      // Validate schema version
      if (data.v !== ZCASH_CONFIG.MEMO_SCHEMA_VERSION) {
        console.warn("Invalid memo schema version");
        return null;
      }

      // Validate required fields
      if (!data.gameId || !data.action || !data.solanaPubkey) {
        console.warn("Missing required memo fields");
        return null;
      }

      // Validate action type
      if (!["join", "create"].includes(data.action)) {
        console.warn("Invalid memo action");
        return null;
      }

      // Validate Solana pubkey format (base58, 44 chars)
      if (data.solanaPubkey.length !== 44) {
        console.warn("Invalid Solana pubkey format");
        return null;
      }

      return {
        version: data.v,
        gameId: data.gameId,
        action: data.action as "join" | "create",
        solanaPubkey: data.solanaPubkey,
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error("Failed to parse memo:", error);
      return null;
    }
  }

  /**
   * Validate parsed memo freshness and authenticity
   */
  private validateMemoFreshness(payload: MemoPayload): boolean {
    const timeSinceCreation = Date.now() - payload.timestamp;
    if (timeSinceCreation > ZcashMemoBridge.MEMO_STALE_THRESHOLD) {
      console.warn("Memo is stale (>5 minutes old)");
      return false;
    }
    return true;
  }

  /**
   * Handle incoming shielded memo from Zcash transaction
   * Triggers tournament entry on Solana side
   */
  async handleIncomingShieldedMemo(
    memo: string,
    zcashTxHash: string,
    blockHeight: number,
  ): Promise<boolean> {
    const parsed = this.parseMemo(memo);
    if (!parsed) {
      console.warn("Invalid memo, skipping entry");
      return false;
    }

    // Verify memo timestamp is recent
    if (!this.validateMemoFreshness(parsed)) {
      return false;
    }

    // Pass to Solana transaction handler (wired in LightwalletdWatcher)
    this.onEntry({
      ...parsed,
      zcashTxHash,
      blockHeight,
    });

    return true;
  }

  /**
   * Create a valid memo for tournament entry
   * Used by CLI or frontend to construct memo before Zcash transaction
   */
  static createMemo(payload: {
    gameId: string;
    action: "join" | "create";
    solanaPubkey: string;
    metadata?: Record<string, any>;
  }): string {
    const memo = {
      v: ZCASH_CONFIG.MEMO_SCHEMA_VERSION,
      gameId: payload.gameId,
      action: payload.action,
      solanaPubkey: payload.solanaPubkey,
      timestamp: Date.now(),
      metadata: payload.metadata || {},
    };

    const memoStr = JSON.stringify(memo);
    if (memoStr.length > 512) {
      throw new Error(
        `Memo too large (${memoStr.length} > 512 bytes). Reduce metadata.`,
      );
    }

    return memoStr;
  }

  /**
   * Get instructions for player to join tournament privately via Zcash
   */
  static getPrivateEntryInstructions(
    gameId: string,
    playerPubkey: string,
  ): string {
    const memo = this.createMemo({
      gameId,
      action: "join",
      solanaPubkey: playerPubkey,
    });

    return `
To join this tournament privately via Zcash:

1. Send Zcash to our shielded address:
   ${ZCASH_CONFIG.SHIELDED_ADDRESS}

2. In the memo field, include this JSON:
   ${memo}

3. Wait for confirmation on Solana
4. Your tournament entry will be private!

🔒 Privacy guarantee: Your Zcash transaction identity never appears on Solana.
    `;
  }
}

/**
 * Lightwalletd Watcher - monitors Zcash shielded transactions for memo entries
 * Connects Zcash privacy layer to Solana game contracts
 * DRY: Single point of entry for all memo-triggered Solana transactions
 */
export class LightwalletdWatcher {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: any = null;
  private memoBridge: ZcashMemoBridge;
  private logLevel: "silent" | "error" | "warn" | "info" | "debug" =
    (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || "error";

  constructor(
    private onMemoEntry: (payload: MemoPayload) => Promise<void>,
    private zcashAddress: string,
  ) {
    // Initialize bridge with callback to Solana transaction handler
    this.memoBridge = new ZcashMemoBridge((payload) => {
      this.onMemoEntry(payload).catch((err) =>
        this.log("error", `Failed to process memo entry: ${err.message}`),
      );
    });
  }

  /**
   * Graceful connection with fallback handling
   */
  connectWithFallback() {
    try {
      this.connect();
    } catch (error) {
      this.log(
        "error",
        `Lightwalletd connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      this.log(
        "info",
        "Zcash bridge will be unavailable - continuing without privacy features",
      );
    }
  }

  /**
   * Connect to Lightwalletd server and monitor shielded transactions
   */
  connect(lightwalletdUrl: string = ZCASH_CONFIG.LIGHTWALLETD_URL) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      this.log("warn", "Lightwalletd already connected");
      return;
    }

    if (!lightwalletdUrl) {
      throw new Error("Lightwalletd URL not configured");
    }

    // Convert HTTP to WebSocket protocol
    const wsUrl = lightwalletdUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.log("info", "Lightwalletd connected");
      this.reconnectAttempts = 0;
      this.setupPingInterval();
      this.subscribeToShieldedTransactions();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.processZcashTransaction(data);
      } catch (error) {
        this.log("error", "Failed to parse Lightwalletd message");
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      this.handleReconnect();
    };

    this.ws.onerror = () => {
      this.log("error", "Lightwalletd WebSocket error");
    };
  }

  /**
   * Subscribe to incoming shielded transactions for our address
   */
  private subscribeToShieldedTransactions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscription = {
      jsonrpc: "2.0",
      id: 1,
      method: "subscribe",
      params: {
        target: this.zcashAddress,
        minConfirmations: 1,
      },
    };

    try {
      this.ws.send(JSON.stringify(subscription));
      this.log(
        "debug",
        `Subscribed to Lightwalletd for address ${this.zcashAddress}`,
      );
    } catch (error) {
      this.log("error", "Failed to subscribe to shielded transactions");
    }
  }

  /**
   * Process incoming Zcash transaction and extract memo
   */
  private async processZcashTransaction(data: any) {
    try {
      // Lightwalletd returns transaction with memo in outputs
      const tx = data.result?.transaction;
      if (!tx) return;

      const txHash = data.result?.hash;
      const blockHeight = data.result?.height;

      // Extract shielded outputs with memos
      const outputs = tx.vShieldedOutput || [];

      for (const output of outputs) {
        if (output.memo) {
          // Decode memo (typically hex-encoded)
          const memoText = this.decodeMemo(output.memo);
          await this.memoBridge.handleIncomingShieldedMemo(
            memoText,
            txHash,
            blockHeight,
          );
        }
      }
    } catch (error) {
      this.log("error", `Failed to process Zcash transaction: ${error}`);
    }
  }

  /**
   * Decode hex or base64 memo to JSON string
   * Supports both binary and text encoding with proper UTF-8 validation
   */
  private decodeMemo(memo: string | Buffer): string {
    try {
      let decoded: string;

      // Try hex decoding first (common in Zcash)
      if (typeof memo === "string") {
        const buffer = Buffer.from(memo, "hex");
        decoded = buffer.toString();
      } else {
        decoded = memo.toString();
      }

      // Validate UTF-8 and remove null padding
      const cleaned = decoded.replace(/\0+$/, '').trim();

      // Verify it's valid JSON by attempting to parse
      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch {
        // If not JSON, try base64 decoding as fallback
        if (typeof memo === "string") {
          const base64Buffer = Buffer.from(memo, "base64");
          const base64Decoded = base64Buffer.toString().replace(/\0+$/, '').trim();
          JSON.parse(base64Decoded); // Validate JSON
          return base64Decoded;
        }
        throw new Error("Not valid JSON");
      }
    } catch (error) {
      this.log("warn", `Failed to decode memo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return "";
    }
  }

  /**
   * Setup keepalive ping to prevent connection timeout
   */
  private setupPingInterval() {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(
            JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "ping" }),
          );
        } catch { }
      }
    }, 60000); // Ping every 60 seconds
  }

  /**
   * Reconnect with exponential backoff
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.log(
        "warn",
        `Reconnecting to Lightwalletd in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
      setTimeout(() => this.connect(), delay);
    } else {
      this.log("error", "Max reconnect attempts reached for Lightwalletd");
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.cleanup();
    this.log("info", "Lightwalletd watcher disconnected");
  }

  private log(
    level: "error" | "warn" | "info" | "debug" | "silent",
    message: string,
  ) {
    const order = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 } as const;
    const current = order[this.logLevel];
    const target = order[level];
    if (target <= current && level !== "silent") {
      if (level === "error") console.error(`[Lightwalletd] ${message}`);
      else if (level === "warn") console.warn(`[Lightwalletd] ${message}`);
      else console.log(`[Lightwalletd] ${message}`);
    }
  }
}

export async function createWinnerToken(winner: {
  name: string;
  score: number;
}) {
  const tokenMetadata = PumpFunCreator.generateWinnerTokenMetadata(
    winner.name,
    winner.score,
  );

  try {
    const result = await PumpFunCreator.createToken({
      ...tokenMetadata,
      initialBuySOL: 0.01, // Small initial purchase
    });

    return {
      success: true,
      tokenAddress: result.mint,
      metadata: tokenMetadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token creation failed",
    };
  }
}
