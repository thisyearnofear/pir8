import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/types/game";
import type { BattleMomentReplay } from "@/lib/battleMoments";
import { buildReplayUrl } from "@/lib/shareLinks";

interface UseReplayPersistenceOptions {
  gameState: GameState | null;
  winnerPublicKey?: string;
}

interface ReplayPersistenceState {
  replay: BattleMomentReplay | null;
  replayUrl: string;
  isPersisting: boolean;
}

export function useReplayPersistence({
  gameState,
  winnerPublicKey,
}: UseReplayPersistenceOptions): ReplayPersistenceState {
  const [replay, setReplay] = useState<BattleMomentReplay | null>(null);
  const [replayUrl, setReplayUrl] = useState("");
  const [isPersisting, setIsPersisting] = useState(false);
  const persistedReplayKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!gameState || gameState.gameStatus !== "completed") {
      setReplay(null);
      setReplayUrl("");
      setIsPersisting(false);
      persistedReplayKeyRef.current = null;
      return;
    }

    const persistenceKey = `${gameState.gameId}:${gameState.turnNumber}:${gameState.winner || winnerPublicKey || "unknown"}`;
    if (persistedReplayKeyRef.current === persistenceKey) {
      return;
    }

    let isMounted = true;
    setIsPersisting(true);

    async function persistReplay() {
      try {
        const response = await fetch("/api/moments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameState,
            winnerPublicKey,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to persist replay artifact");
        }

        const nextReplay = (await response.json()) as BattleMomentReplay;
        if (!isMounted) return;

        persistedReplayKeyRef.current = persistenceKey;
        setReplay(nextReplay);
        setReplayUrl(buildReplayUrl({ momentId: nextReplay.id }));
      } catch (error) {
        if (isMounted) {
          console.warn("Unable to persist replay artifact", error);
        }
      } finally {
        if (isMounted) {
          setIsPersisting(false);
        }
      }
    }

    persistReplay();

    return () => {
      isMounted = false;
    };
  }, [gameState, winnerPublicKey]);

  return {
    replay,
    replayUrl,
    isPersisting,
  };
}
