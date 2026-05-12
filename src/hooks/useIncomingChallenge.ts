import { useEffect } from "react";

export interface IncomingChallengeRecord {
  id: string;
  type: "shadow-skirmish" | "duel" | "watch";
  status:
    | "open"
    | "accepted"
    | "started"
    | "completed"
    | "expired"
    | "rejected";
  gameId: string | null;
  referrer: string | null;
}

interface UseIncomingChallengeOptions {
  handledIncomingChallenge: boolean;
  publicKey?: { toString(): string } | null;
  wallet?: unknown;
  setHandledIncomingChallenge: (value: boolean) => void;
  setJoinError: (value: string | undefined) => void;
  setShowAIBattleModal: (value: boolean) => void;
  setShowPracticeMenu: (value: boolean) => void;
  handleGameEvent: (message: string) => void;
  handleJoinGame: (gameIdInput: string) => Promise<boolean>;
}

export function useIncomingChallenge({
  handledIncomingChallenge,
  publicKey,
  wallet,
  setHandledIncomingChallenge,
  setJoinError,
  setShowAIBattleModal,
  setShowPracticeMenu,
  handleGameEvent,
  handleJoinGame,
}: UseIncomingChallengeOptions) {
  useEffect(() => {
    if (handledIncomingChallenge || typeof window === "undefined") return;

    let isMounted = true;

    async function processIncomingChallenge() {
      const params = new URLSearchParams(window.location.search);
      const challenge = params.get("challenge");
      const joinId = params.get("join");
      const challengeId = params.get("challengeId");

      if (!challenge && !joinId && !challengeId) return;

      let resolvedChallenge = challenge;
      let resolvedJoinId = joinId;

      if (challengeId) {
        try {
          const response = await fetch(`/api/challenges?challengeId=${challengeId}`, {
            cache: "no-store",
          });
          if (response.ok) {
            const record = (await response.json()) as IncomingChallengeRecord;
            resolvedChallenge = record.type;
            resolvedJoinId = record.gameId;

            if (record.status === "expired") {
              if (!isMounted) return;
              setHandledIncomingChallenge(true);
              setJoinError("This shared challenge has expired.");
              handleGameEvent("Shared challenge expired.");
              return;
            }

            if (record.status === "rejected") {
              if (!isMounted) return;
              setHandledIncomingChallenge(true);
              setJoinError("This shared challenge is no longer available.");
              handleGameEvent("Shared challenge is no longer available.");
              return;
            }
          }
        } catch {
          // Fall back to raw query params if canonical challenge lookup fails.
        }
      }

      if (!isMounted) return;

      if (resolvedJoinId) {
        setHandledIncomingChallenge(true);
        if (publicKey && wallet) {
          handleGameEvent("Opening shared PIR8 duel...");
          const joined = await handleJoinGame(resolvedJoinId);
          if (joined && challengeId) {
            try {
              await fetch("/api/challenges", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  challengeId,
                  status: "accepted",
                  account: publicKey.toString(),
                }),
              });
            } catch {
              // Non-fatal: acceptance recording failed, game join still succeeded.
            }
          }
        } else {
          setJoinError("Connect your wallet to accept this shared duel.");
          handleGameEvent("Shared duel loaded. Connect wallet to accept.");
        }
        return;
      }

      if (resolvedChallenge === "watch") {
        setHandledIncomingChallenge(true);
        setShowAIBattleModal(true);
        handleGameEvent("Shared ambush loaded. Choose captains to watch.");
        return;
      }

      // Shadow skirmish: record acceptance immediately (no on-chain tx needed).
      if (challengeId) {
        try {
          await fetch("/api/challenges", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeId,
              status: "accepted",
              account: publicKey?.toString(),
            }),
          });
        } catch {
          // Non-fatal.
        }
      }

      setHandledIncomingChallenge(true);
      setShowPracticeMenu(true);
      handleGameEvent("Challenge loaded. Start a private skirmish.");
    }

    processIncomingChallenge();

    return () => {
      isMounted = false;
    };
  }, [
    handledIncomingChallenge,
    publicKey,
    wallet,
    setHandledIncomingChallenge,
    setJoinError,
    setShowAIBattleModal,
    setShowPracticeMenu,
    handleGameEvent,
    handleJoinGame,
  ]);
}
