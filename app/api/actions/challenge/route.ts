import {
  ACTIONS_CORS_HEADERS,
  actionJson,
  getRequestOrigin,
} from "@/lib/actionsCors";
import { recordChallengeAcceptance } from "@/lib/server/competitiveStore";
import { SOLANA_CONFIG } from "@/utils/constants";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

function buildSiteUrl(origin: string, searchParams: URLSearchParams) {
  const siteParams = new URLSearchParams();
  const challenge = searchParams.get("challenge") || "shadow-skirmish";
  const join = searchParams.get("join");
  const ref = searchParams.get("ref");

  siteParams.set("challenge", challenge);
  if (join) siteParams.set("join", join);
  if (ref) siteParams.set("ref", ref);

  return `${origin}?${siteParams.toString()}`;
}

function getChallengeLabel(challenge: string, hasJoin: boolean) {
  if (hasJoin) return "Accept PIR8 Duel";
  if (challenge === "watch") return "Watch Ambush";
  return "Start Shadow Skirmish";
}

export function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const challenge = url.searchParams.get("challenge") || "shadow-skirmish";
  const join = url.searchParams.get("join");
  const siteUrl = buildSiteUrl(origin, url.searchParams);
  const label = getChallengeLabel(challenge, !!join);

  return actionJson({
    type: "action",
    icon: `${origin}/pir8-action.svg`,
    title: join ? "PIR8 Duel Challenge" : "PIR8 Shadow Seas",
    description: join
      ? "Accept a PIR8 duel. Scout hidden waters, mask your fleet, and try to beat the shared position."
      : "Open PIR8 around the core loop: scout hidden waters, mask your fleet, reveal the ambush.",
    label,
    links: {
      actions: [
        {
          label,
          href: `/api/actions/challenge?${url.searchParams.toString()}`,
        },
        {
          label: "Open Game",
          href: siteUrl,
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  let account: string | undefined;
  const url = new URL(request.url);
  const challenge = url.searchParams.get("challenge") || "shadow-skirmish";
  const join = url.searchParams.get("join");
  const ref = url.searchParams.get("ref");

  try {
    const body = (await request.json()) as { account?: string };
    account = body.account;
  } catch {
    return actionJson(
      { message: "Invalid Action request body. Expected an account field." },
      { status: 400 },
    );
  }

  if (!account) {
    return actionJson(
      { message: "Missing wallet account for this PIR8 challenge." },
      { status: 400 },
    );
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(account);
  } catch {
    return actionJson(
      { message: "Invalid wallet account for this PIR8 challenge." },
      { status: 400 },
    );
  }

  try {
    const rpcUrl =
      SOLANA_CONFIG.RPC_URL ||
      clusterApiUrl(SOLANA_CONFIG.NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet");
    const connection = new Connection(rpcUrl, "confirmed");
    const { blockhash } = await connection.getLatestBlockhash();
    const acceptance = await recordChallengeAcceptance({
      account,
      challenge,
      join,
      ref,
    });

    const memo = [
      "PIR8 challenge accepted",
      `id=${acceptance.id}`,
      `challenge=${challenge}`,
      join ? `join=${join}` : null,
      ref ? `ref=${ref}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    const transaction = new Transaction({
      feePayer: publicKey,
      recentBlockhash: blockhash,
    }).add(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, "utf8") as Buffer,
      }),
    );

    const serialized = (transaction as any)
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      .toString("base64");

    return actionJson({
      transaction: serialized,
      message:
        "Sign this PIR8 challenge receipt to record your accepted duel intent. Open the game after signing to play or spectate.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Action error";
    return actionJson(
      {
        message: `Unable to build PIR8 challenge receipt: ${message}`,
      },
      { status: 500 },
    );
  }

}
