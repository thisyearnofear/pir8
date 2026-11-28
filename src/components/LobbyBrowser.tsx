/**
 * LobbyBrowser - Component for browsing and joining multi-game lobbies
 * Following: MODULAR, CLEAN, PERFORMANT
 */

"use client";

import { useState, useEffect } from "react";
import { usePirateGame } from "@/store/gameStore";
import { useSafeWallet } from "@/components/SafeWalletProvider";
import { useSessionKey } from "@/hooks/useSessionKey";
import { createPlayerFromWallet } from "@/lib/playerHelper";
import { Icon } from "@/components/ui/Icon";

export default function LobbyBrowser() {
  const {
    lobbies,
    fetchLobbies,
    isLoading,
    startGame,
    createGame,
    joinGame: joinGameStore,
  } = usePirateGame();
  const fullWallet = useSafeWallet();
  const { publicKey, wallet } = fullWallet;
  const { state: sessionState, createSession, clearSession } = useSessionKey();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameId, setNewGameId] = useState<number>(
    Math.floor(Math.random() * 1000),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [joiningLobby, setJoiningLobby] = useState<string | null>(null);
  const [startingGameId, setStartingGameId] = useState<string | null>(null);
  const [privateMode, setPrivateMode] = useState(false);
  const [arenaFilter, setArenaFilter] = useState<"all" | "shadow">("all");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !wallet) return;
    fetchLobbies(wallet);
    const interval = setInterval(() => fetchLobbies(wallet), 10000);
    return () => clearInterval(interval);
  }, [fetchLobbies, publicKey, wallet]);

  const handleCreate = async () => {
    if (!publicKey || !wallet) {
      console.warn("Wallet not connected");
      return;
    }

    setIsCreating(true);
    try {
      const player = createPlayerFromWallet(publicKey);
      const created = await createGame(newGameId, [player], 0, wallet);
      if (!created) {
        throw new Error("Failed to initialize game");
      }

      const joined = await joinGameStore(newGameId, player, wallet);
      if (!joined) {
        throw new Error("Failed to join created game");
      }

      setShowCreateModal(false);
      console.log("Game creation completed successfully");
    } catch (error) {
      console.error("Failed to create game:", error);
      setLocalError(`Failed to create game: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async (lobbyAddress: string, gameId?: number) => {
    if (!publicKey) {
      console.warn("Wallet publicKey not available");
      setLocalError("Please connect your wallet first. Click the wallet button in the top right.");
      return;
    }
    if (!wallet) {
      console.warn("Wallet adapter not available");
      setLocalError("Wallet not ready. Please wait a moment or refresh the page.");
      return;
    }

    if (joiningLobby === lobbyAddress) {
      console.log("Already joining this lobby");
      return;
    }

    setJoiningLobby(lobbyAddress);
    try {
      const {
        joinGameViaDelegate,
        createWalletAdapter,
        getClientProgram,
      } = await import("@/lib/client/transactionBuilder");
      const { PublicKey } = await import("@solana/web3.js");

      let targetGameId = gameId;

      if (!targetGameId) {
        console.log(`Fetching gameId from lobby: ${lobbyAddress}`);
        const walletAdapter = createWalletAdapter(fullWallet);
        const program = await getClientProgram(walletAdapter);
        const gameAccount = await (
          program as any
        ).account.pirateGame.fetchNullable(new PublicKey(lobbyAddress));
        if (!gameAccount) {
          throw new Error("Lobby not found on chain");
        }
        targetGameId = gameAccount.gameId.toNumber();
        console.log(`Found gameId: ${targetGameId}`);
      }

      console.log(
        `Joining lobby: ${lobbyAddress} with gameId: ${targetGameId}, privateMode: ${privateMode}`,
      );

      if (!targetGameId) throw new Error("Could not resolve gameId");

      if (privateMode && sessionState.keypair) {
        const walletAdapter = createWalletAdapter(fullWallet);
        console.log("Joining via delegate (session key)");
        const joinTx = await joinGameViaDelegate(
          walletAdapter,
          targetGameId,
          sessionState.keypair.publicKey,
          fullWallet.publicKey,
        );
        console.log("Joined lobby via delegate:", joinTx);
        await fetchLobbies(wallet);
      } else {
        const player = createPlayerFromWallet(publicKey);
        const joined = await joinGameStore(targetGameId, player, wallet);
        if (!joined) {
          throw new Error("Failed to join lobby");
        }
      }
    } catch (error) {
      console.error("Failed to join lobby:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLocalError(`Failed to join: ${errorMessage}`);
    } finally {
      setJoiningLobby(null);
    }
  };

  const handleStartGame = async (lobbyAddress: string, gameId?: number) => {
    if (!publicKey || !wallet) {
      setLocalError("Please connect your wallet first");
      return;
    }
    if (startingGameId === lobbyAddress) {
      return;
    }

    setStartingGameId(lobbyAddress);
    try {
      let targetGameId = gameId;

      if (!targetGameId) {
        const { createWalletAdapter } =
          await import("@/lib/client/transactionBuilder");
        const { PublicKey } = await import("@solana/web3.js");
        const walletAdapter = createWalletAdapter(fullWallet);
        const { getClientProgram } =
          await import("@/lib/client/transactionBuilder");
        const program = await getClientProgram(walletAdapter);
        const gameAccount = await (
          program as any
        ).account.pirateGame.fetchNullable(new PublicKey(lobbyAddress));
        if (!gameAccount) {
          throw new Error("Lobby not found on chain");
        }
        targetGameId = gameAccount.gameId.toNumber();
      }

      console.log(
        `Starting game: ${lobbyAddress} with gameId: ${targetGameId}`,
      );
      const success = await startGame(targetGameId ?? 0, wallet);

      if (success) {
        console.log("Game started successfully");
        await fetchLobbies(wallet);
      } else {
        throw new Error("Failed to start game");
      }
    } catch (error) {
      console.error("Failed to start game:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLocalError(`Failed to start game: ${errorMessage}`);
    } finally {
      setStartingGameId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-6 shadow-[0_2px_8px_rgba(0,0,0,.45)]">
      {/* Error toast */}
      {localError && (
        <div className="mb-4 flex items-center justify-between rounded-[var(--p8-radius)] border border-[color-mix(in_srgb,var(--p8-threat)_55%,transparent)] bg-[color-mix(in_srgb,var(--p8-threat)_12%,transparent)] p-3 text-sm text-[var(--p8-vellum)]" role="alert">
          <span>{localError}</span>
          <button onClick={() => setLocalError(null)} className="ml-2 text-[var(--p8-vellum-dim)] transition-colors hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]" aria-label="Dismiss error">
            <Icon name="close" size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-world)] text-3xl text-[var(--p8-vellum)]">
            Battle lobbies
          </h2>
          <p className="text-sm text-[var(--p8-vellum-dim)]">
            Find an active arena or spawn your own
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-6 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
        >
          + New arena
        </button>
      </div>

      {/* Play Privately Toggle */}
      <div className="mb-6 flex items-center gap-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={privateMode}
              onChange={(e) => {
                if (e.target.checked && !sessionState.isActive) {
                  createSession();
                } else if (!e.target.checked) {
                  clearSession();
                }
                setPrivateMode(e.target.checked);
              }}
              className="sr-only"
            />
            <div
              className={`h-6 w-12 rounded-full border border-[var(--p8-brass-line)] transition-colors ${
                privateMode ? "bg-[var(--p8-lamp)]" : "bg-[var(--p8-deep)]"
              }`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                  privateMode ? "translate-x-7 bg-[#0b1418]" : "translate-x-1 bg-[var(--p8-vellum-dim)]"
                }`}
              />
            </div>
          </div>
          <div>
            <span className="font-bold text-[var(--p8-vellum)]">Play privately</span>
            <p className="text-xs text-[var(--p8-vellum-dim)]">
              Use session key to hide your identity
            </p>
          </div>
        </label>
        {sessionState.isActive && (
          <div className="ml-auto flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--p8-signal)]" />
            <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
              Session: {sessionState.publicKey?.toBase58().slice(0, 8)}…
            </span>
          </div>
        )}
      </div>

      {/* Arena Type Tabs */}
      <div className="mb-6 inline-flex gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-1">
        <button
          onClick={() => setArenaFilter("all")}
          aria-pressed={arenaFilter === "all"}
          className={`inline-flex items-center gap-2 rounded-[var(--p8-radius)] px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)] ${
            arenaFilter === "all"
              ? "bg-[var(--p8-lamp)] text-[#0b1418]"
              : "text-[var(--p8-vellum-dim)] hover:text-[var(--p8-vellum)]"
          }`}
        >
          <Icon name="water" size={15} strokeWidth={1.5} />
          Public arena
        </button>
        <button
          onClick={() => setArenaFilter("shadow")}
          aria-pressed={arenaFilter === "shadow"}
          className={`inline-flex items-center gap-2 rounded-[var(--p8-radius)] px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)] ${
            arenaFilter === "shadow"
              ? "border border-[var(--p8-lamp)] bg-[var(--p8-ink)] text-[var(--p8-lamp)]"
              : "text-[var(--p8-vellum-dim)] hover:text-[var(--p8-vellum)]"
          }`}
        >
          <Icon name="eye-off" size={15} strokeWidth={1.5} />
          Shadow arena
        </button>
      </div>

      {/* Wallet not connected warning */}
      {!publicKey && (
        <div className="mb-6 flex items-center justify-between rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] text-[var(--p8-lamp)]">
              <Icon name="lock" size={18} strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-bold text-[var(--p8-vellum)]">Wallet not connected</p>
              <p className="text-sm text-[var(--p8-vellum-dim)]">
                Connect your wallet to join battles
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Trigger wallet modal
              const event = new CustomEvent("wallet-modal-open");
              window.dispatchEvent(event);
            }}
            className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-2 text-sm font-bold text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
          >
            Connect wallet
          </button>
        </div>
      )}

      {isLoading && lobbies.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--p8-brass-line)] border-t-[var(--p8-lamp)]"></div>
          <p className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum-dim)]">
            Scanning seas…
          </p>
        </div>
      ) : lobbies.length === 0 ? (
        <div className="rounded-[var(--p8-radius)] border border-dashed border-[var(--p8-brass-line)] bg-[var(--p8-ink)] py-12 text-center">
          <p className="mb-4 text-[var(--p8-vellum-dim)]">
            No active battles found in your sector.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="font-bold text-[var(--p8-lamp)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            Be the first to spawn an arena →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lobbies
            .filter((lobby: any) => {
              // Shadow Arena: filter by private game or hidden flag
              if (arenaFilter === "shadow") {
                return lobby.isPrivate || lobby.hidden;
              }
              return true; // Show all in public arena
            })
            .map((lobby: any) => {
              // Determine if game is joinable
              // Anchor enums come back as objects like { waiting: {} } or { active: {} }
              const statusKey = lobby.status
                ? Object.keys(lobby.status)[0]?.toLowerCase()
                : "unknown";
              const isWaiting = statusKey === "waiting";
              // maxPlayers isn't stored on-chain, use constant from GAME_CONFIG (MAX_PLAYERS = 4)
              const maxPlayers = 4;
              const hasSpace = lobby.playerCount < maxPlayers;
              const isJoinable = isWaiting && hasSpace;

              // Check if current user is already in this game
              const userWalletPk = publicKey?.toBase58();
              const isUserInGame =
                userWalletPk && lobby.players?.includes(userWalletPk);
              const isUserGameWaiting =
                isUserInGame && isWaiting && lobby.playerCount === 1;

              // Check if user is the game creator (authority) and can start the game
              const isGameCreator =
                userWalletPk && lobby.authority === userWalletPk;
              const canStartGame =
                isGameCreator && isWaiting && lobby.playerCount >= 2;

              return (
                <div
                  key={lobby.address}
                  className={`rounded-[var(--p8-radius)] border p-4 transition-colors ${
                    isUserInGame
                      ? "border-[var(--p8-lamp)] bg-[color-mix(in_srgb,var(--p8-lamp)_8%,transparent)]"
                      : "border-[var(--p8-brass-line)] bg-[var(--p8-ink)] hover:border-[var(--p8-brass)]"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
                        Lobby ID
                        {isUserInGame && (
                          <span className="rounded-full bg-[var(--p8-lamp)] px-1.5 py-0.5 font-[var(--font-instrument)] text-[11px] text-[#0b1418]">
                            You&apos;re in
                          </span>
                        )}
                      </div>
                      <div className="max-w-[180px] truncate text-lg font-bold text-[var(--p8-vellum)]">
                        {lobby.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-mute)]">
                        Status
                      </div>
                      <div
                        className={`rounded border px-2 py-0.5 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] ${
                          isUserGameWaiting
                            ? "border-[var(--p8-lamp)] bg-[color-mix(in_srgb,var(--p8-lamp)_14%,transparent)] text-[var(--p8-lamp)]"
                            : isJoinable
                              ? "border-[color-mix(in_srgb,var(--p8-signal)_55%,transparent)] bg-[color-mix(in_srgb,var(--p8-signal)_12%,transparent)] text-[var(--p8-signal)]"
                              : statusKey === "active"
                                ? "border-[var(--p8-lamp)] bg-[color-mix(in_srgb,var(--p8-lamp)_12%,transparent)] text-[var(--p8-lamp)]"
                                : "border-[color-mix(in_srgb,var(--p8-threat)_55%,transparent)] bg-[color-mix(in_srgb,var(--p8-threat)_12%,transparent)] text-[var(--p8-threat)]"
                        }`}
                      >
                        {isUserGameWaiting
                          ? "Awaiting opponent…"
                          : isWaiting
                            ? `Waiting (${lobby.playerCount}/${maxPlayers})`
                            : statusKey}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {/* Shadow Arena: Hide player identities until game starts */}
                      {arenaFilter === "shadow" && statusKey === "waiting" ? (
                        // Show anonymous avatars in Shadow Arena waiting lobbies
                        <>
                          {Array.from({ length: Math.max(0, maxPlayers) }).map(
                            (_, idx) => (
                              <div
                                key={idx}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                                  idx < lobby.playerCount
                                    ? "border-[var(--p8-brass)] bg-[var(--p8-deep)] text-[var(--p8-vellum-dim)]"
                                    : "border-dashed border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-vellum-mute)]"
                                }`}
                              >
                                {idx < lobby.playerCount ? "?" : "+"}
                              </div>
                            ),
                          )}
                        </>
                      ) : (
                        // Show actual player avatars
                        <>
                          {lobby.players
                            ?.slice(0, 4)
                            .map((player: string, idx: number) => (
                              <div
                                key={idx}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border font-[var(--font-instrument)] text-[11px] ${
                                  player === userWalletPk
                                    ? "border-[var(--p8-lamp)] bg-[var(--p8-lamp)] text-[#0b1418]"
                                    : "border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-vellum-dim)]"
                                }`}
                                title={
                                  player === userWalletPk
                                    ? "You"
                                    : `Player ${idx + 1}`
                                }
                              >
                                {player.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                          {lobby.playerCount > 4 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
                              +{lobby.playerCount - 4}
                            </div>
                          )}
                          {Array.from({
                            length: Math.max(0, maxPlayers - lobby.playerCount),
                          }).map((_, idx) => (
                            <div
                              key={`empty-${idx}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-xs text-[var(--p8-vellum-mute)]"
                            >
                              ?
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {canStartGame && (
                        <button
                          onClick={() =>
                            handleStartGame(lobby.address, lobby.gameId)
                          }
                          disabled={!!startingGameId}
                          className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-1.5 text-sm font-bold text-[#0b1418] transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
                        >
                          {startingGameId === lobby.address
                            ? "Starting…"
                            : "Start game"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleJoinLobby(lobby.address, lobby.gameId)
                        }
                        disabled={
                          !!joiningLobby ||
                          !isJoinable ||
                          isUserInGame ||
                          !publicKey
                        }
                        className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-1.5 text-sm font-bold text-[var(--p8-vellum)] transition-colors hover:border-[var(--p8-brass)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
                      >
                        {!publicKey
                          ? "Connect wallet"
                          : joiningLobby === lobby.address
                            ? "Boarding…"
                            : isUserInGame
                              ? isUserGameWaiting
                                ? "Waiting…"
                                : "In game"
                              : isJoinable
                                ? "Board ship"
                                : "Full/started"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-8 shadow-[0_2px_8px_rgba(0,0,0,.45)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Spawn arena"
          >
            <h3 className="mb-4 font-[var(--font-world)] text-2xl text-[var(--p8-vellum)]">
              Spawn arena
            </h3>
            <div className="mb-8 space-y-4">
              <div>
                <label className="mb-2 block font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]" htmlFor="lobby-seed">
                  Game lobby seed (number)
                </label>
                <input
                  id="lobby-seed"
                  type="number"
                  value={newGameId}
                  onChange={(e) => setNewGameId(parseInt(e.target.value))}
                  className="w-full rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3 font-[var(--font-instrument)] text-[var(--p8-vellum)] placeholder:text-[var(--p8-vellum-mute)] focus:border-[var(--p8-lamp)] focus:outline-none"
                />
              </div>
              <p className="text-xs italic text-[var(--p8-vellum-dim)]">
                Each seed creates a unique coordinates map on the Solana ledger.
                Share this ID with your crew or agents to join.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] py-3 font-bold text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] py-3 font-bold text-[#0b1418] transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
              >
                {isCreating ? "Spawning…" : "Start battle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
