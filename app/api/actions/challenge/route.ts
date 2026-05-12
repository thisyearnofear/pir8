import {
  ACTIONS_CORS_HEADERS,
  actionJson,
  getRequestOrigin,
} from "@/lib/actionsCors";
import { ChallengeStatus, ChallengeType } from "@/lib/competitiveData";
import {
  createChallengeRecord,
  getChallengeRecord,
  markChallengeExpired,
} from "@/lib/server/competitiveStore";
import { SOLANA_CONFIG } from "@/utils/constants";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getGamePDA, PROGRAM_ID } from "@/lib/anchor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

function toChallengeType(value: string | null): ChallengeType {
  if (value === "duel" || value === "watch" || value === "shadow-skirmish") {
    return value;
  }
  return "shadow-skirmish";
}

function buildSiteUrl(origin: string, searchParams: URLSearchParams) {
  const siteParams = new URLSearchParams();
  const challenge = toChallengeType(searchParams.get("challenge"));
  const join = searchParams.get("join");
  const ref = searchParams.get("ref");
  const challengeId = searchParams.get("challengeId");

  siteParams.set("challenge", challenge);
  if (join) siteParams.set("join", join);
  if (ref) siteParams.set("ref", ref);
  if (challengeId) siteParams.set("challengeId", challengeId);

  return `${origin}?${siteParams.toString()}`;
}

function getChallengeLabel(challenge: ChallengeType, hasJoin: boolean) {
  if (challenge === "watch") return "Watch Ambush";
  if (challenge === "duel" || hasJoin) return "Accept PIR8 Duel";
  return "Start Shadow Skirmish";
}

function getChallengeTitle(challenge: ChallengeType, hasJoin: boolean) {
  if (challenge === "watch") return "PIR8 Spectate Challenge";
  if (challenge === "duel" || hasJoin) return "PIR8 Duel Challenge";
  return "PIR8 Shadow Seas";
}

function getChallengeDescription(challenge: ChallengeType, hasJoin: boolean) {
  if (challenge === "watch") {
    return "Open a public PIR8 replay or spectator view without claiming a duel seat.";
  }
  if (challenge === "duel" || hasJoin) {
    return "Accept a PIR8 duel. The join flow only counts after your wallet signs and submits the challenge transaction.";
  }
  return "Start a local PIR8 shadow skirmish. Practice intent stays preview-only until a real match is created.";
}

function buildStatusMessage(status: ChallengeStatus) {
  switch (status) {
    case "accepted":
      return "Challenge acceptance recorded after wallet confirmation.";
    case "expired":
      return "Challenge expired before it could be accepted.";
    case "started":
      return "Challenge has moved into an active match.";
    case "completed":
      return "Challenge has already been completed.";
    case "rejected":
      return "Challenge was rejected.";
    default:
      return "Challenge is open.";
  }
}

// Discriminator for joinGame instruction from IDL
const JOIN_GAME_DISCRIMINATOR = Buffer.from(
  new Uint8Array([107, 112, 18, 38, 56, 173, 60, 128]),
);

function serializeToBase64(transaction: Transaction): string {
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  }) as Uint8Array;
  const buffer = Buffer.alloc(serialized.length);
  serialized.forEach((byte, index) => {
    buffer[index] = byte;
  });
  return buffer.toString("base64");
}

async function buildJoinTransaction(
  account: string,
  gameId: number,
): Promise<string> {
  const publicKey = new PublicKey(account);
  const rpcUrl =
    SOLANA_CONFIG.RPC_URL ||
    clusterApiUrl(
      SOLANA_CONFIG.NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet",
    );
  const connection = new Connection(rpcUrl, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash();

  const [gamePDA] = getGamePDA(gameId);

  const transaction = new Transaction({
    feePayer: publicKey,
    recentBlockhash: blockhash,
  }).add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: gamePDA, isSigner: false, isWritable: true },
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: JOIN_GAME_DISCRIMINATOR as Buffer,
    }),
  );

  return serializeToBase64(transaction);
}

async function buildPreviewTransaction(
  account: string,
  memoLines: string[],
): Promise<string> {
  const publicKey = new PublicKey(account);
  const rpcUrl =
    SOLANA_CONFIG.RPC_URL ||
    clusterApiUrl(
      SOLANA_CONFIG.NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet",
    );
  const connection = new Connection(rpcUrl, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash();

  const memoData = Buffer.from(memoLines.join("; "), "utf8");

  const transaction = new Transaction({
    feePayer: publicKey,
    recentBlockhash: blockhash,
  }).add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
      data: memoData as Buffer,
    }),
  );

  return serializeToBase64(transaction);
}

function buildChallengeStatusUrl(origin: string, challengeId: string) {
  return `${origin}/api/challenges?challengeId=${challengeId}`;
}

export function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const challenge = toChallengeType(url.searchParams.get("challenge"));
  const join = url.searchParams.get("join");
  const siteUrl = buildSiteUrl(origin, url.searchParams);
  const label = getChallengeLabel(challenge, !!join);

  return actionJson({
    type: "action",
    icon: `${origin}/pir8-action.svg`,
    title: getChallengeTitle(challenge, !!join),
    description: getChallengeDescription(challenge, !!join),
    label,
    links: {
      actions: [
        {
          label,
          href: `/api/actions/challenge?${url.searchParams.toString()}`,
        },
        {
          label: challenge === "watch" ? "Open Spectator View" : "Open Game",
          href: siteUrl,
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  let account: string | undefined;
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const challenge = toChallengeType(url.searchParams.get("challenge"));
  const join = url.searchParams.get("join");
  const ref = url.searchParams.get("ref");
  const challengeId = url.searchParams.get("challengeId");

  try {
    const body = (await request.json()) as {
      account?: string;
    };
    account = body.account;

    if (!account) {
      return actionJson(
        { message: "Missing wallet account for this PIR8 challenge." },
        { status: 400 },
      );
    }

    try {
      new PublicKey(account);
    } catch {
      return actionJson(
        { message: "Invalid wallet account for this PIR8 challenge." },
        { status: 400 },
      );
    }

    if (challenge === "watch") {
      const record = challengeId
        ? await getChallengeRecord(challengeId)
        : await createChallengeRecord({
            type: challenge,
            creatorId: ref || "spectator_link",
            gameId: join,
            referrer: ref,
          });

      if (!record) {
        return actionJson(
          { message: "Unable to create spectator challenge record." },
          { status: 500 },
        );
      }

      return actionJson({
        type: "completed",
        message:
          "Spectator intent recorded. Open the game to watch the public replay or queue.",
        links: {
          next: {
            type: "inline",
            action: {
              label: "Open Spectator View",
              href: buildSiteUrl(origin, new URLSearchParams({
                challenge: record.type,
                ...(record.gameId ? { join: record.gameId } : {}),
                ...(record.referrer ? { ref: record.referrer } : {}),
                challengeId: record.id,
              })),
            },
          },
        },
      });
    }

    if (challengeId) {
      const existing = await getChallengeRecord(challengeId);
      if (!existing) {
        return actionJson(
          { message: "Challenge not found." },
          { status: 404 },
        );
      }

      if (existing.status === "expired") {
        return actionJson(
          { message: buildStatusMessage(existing.status) },
          { status: 410 },
        );
      }

      if (existing.status === "completed") {
        return actionJson(
          { message: buildStatusMessage(existing.status) },
          { status: 409 },
        );
      }
    }

    const record = challengeId
      ? await getChallengeRecord(challengeId)
      : await createChallengeRecord({
          type: challenge,
          creatorId: ref || account,
          gameId: join,
          referrer: ref,
          expiresAt:
            challenge === "duel"
              ? new Date(Date.now() + 1000 * 60 * 60).toISOString()
              : null,
        });

    if (!record) {
      return actionJson(
        { message: "Unable to create challenge record." },
        { status: 500 },
      );
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      await markChallengeExpired({
        challengeId: record.id,
        statusReason: "Challenge expired before acceptance.",
      });
      return actionJson(
        { message: "Challenge expired." },
        { status: 410 },
      );
    }

    let serialized: string;
    let txMessage: string;

    if (record.type === "duel" && record.gameId) {
      const gameIdNum = parseInt(record.gameId, 10);
      if (!isNaN(gameIdNum)) {
        serialized = await buildJoinTransaction(account, gameIdNum);
        txMessage =
          "Join transaction prepared. Sign to accept the duel — acceptance is recorded only after your wallet confirms the transaction.";
      } else {
        serialized = await buildPreviewTransaction(account, [
          "PIR8 duel preview",
          `id=${record.id}`,
          `challenge=${record.type}`,
          `join=${record.gameId}`,
          `ref=${record.referrer || "none"}`,
          "status=open",
        ]);
        txMessage =
          "Duel preview prepared. Acceptance is recorded after wallet confirmation through the challenge status endpoint.";
      }
    } else if (record.type === "shadow-skirmish") {
      // Shadow skirmish: local receipt only, no on-chain transaction needed.
      // Return a completed action directing the client to open the game.
      return actionJson({
        type: "completed",
        message: "Shadow skirmish receipt created. Open the game to start your private practice match.",
        links: {
          next: {
            type: "inline",
            action: {
              label: "Open Game",
              href: buildSiteUrl(origin, new URLSearchParams({
                challenge: record.type,
                ...(record.gameId ? { join: record.gameId } : {}),
                ...(record.referrer ? { ref: record.referrer } : {}),
                challengeId: record.id,
              })),
            },
          },
        },
        challenge: {
          id: record.id,
          status: record.status,
          statusUrl: buildChallengeStatusUrl(origin, record.id),
        },
      });
    } else {
      serialized = await buildPreviewTransaction(account, [
        "PIR8 challenge preview",
        `id=${record.id}`,
        `challenge=${record.type}`,
        `join=${record.gameId || "none"}`,
        `ref=${record.referrer || "none"}`,
        "status=open",
      ]);
      txMessage =
        "Preview transaction prepared. Acceptance is recorded after wallet confirmation through the challenge status endpoint.";
    }

    return actionJson({
      transaction: serialized,
      message: txMessage,
      links: {
        next: {
          type: "inline",
          action: {
            label: record.type === "duel" ? "Open Duel" : "Open Game",
            href: buildSiteUrl(origin, new URLSearchParams({
              challenge: record.type,
              ...(record.gameId ? { join: record.gameId } : {}),
              ...(record.referrer ? { ref: record.referrer } : {}),
              challengeId: record.id,
            })),
          },
        },
      },
      challenge: {
        id: record.id,
        status: record.status,
        statusUrl: buildChallengeStatusUrl(origin, record.id),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Action error";
    return actionJson(
      {
        message: `Unable to build PIR8 challenge flow: ${message}`,
      },
      { status: 500 },
    );
  }
}
