import {
  ACTIONS_CORS_HEADERS,
  actionJson,
} from "@/lib/actionsCors";
import {
  ChallengeStatus,
  ChallengeType,
} from "@/lib/competitiveData";
import {
  getChallengeRecord,
  listChallengeRecords,
  updateChallengeStatus,
} from "@/lib/server/competitiveStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toChallengeType(value: string | null): ChallengeType | undefined {
  if (value === "duel" || value === "watch" || value === "shadow-skirmish") {
    return value;
  }
  return undefined;
}

function toChallengeStatus(value: string | null): ChallengeStatus | undefined {
  switch (value) {
    case "open":
    case "accepted":
    case "started":
    case "completed":
    case "expired":
    case "rejected":
      return value;
    default:
      return undefined;
  }
}

export function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challengeId = url.searchParams.get("challengeId");

  if (challengeId) {
    const record = await getChallengeRecord(challengeId);
    if (!record) {
      return actionJson({ message: "Challenge not found." }, { status: 404 });
    }

    return actionJson(record);
  }

  const status = toChallengeStatus(url.searchParams.get("status"));
  const type = toChallengeType(url.searchParams.get("type"));
  const records = await listChallengeRecords({ status, type });
  return actionJson({ records });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      challengeId?: string;
      status?: ChallengeStatus;
      account?: string;
      signature?: string | null;
      statusReason?: string | null;
    };

    if (!body.challengeId) {
      return actionJson(
        { message: "challengeId is required." },
        { status: 400 },
      );
    }

    if (!body.status) {
      return actionJson(
        { message: "status is required." },
        { status: 400 },
      );
    }

    const record = await updateChallengeStatus({
      challengeId: body.challengeId,
      status: body.status,
      account: body.account,
      signature: body.signature,
      statusReason: body.statusReason,
    });

    return actionJson(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown status error";
    const statusCode = message === "Challenge not found" ? 404 : 400;
    return actionJson({ message }, { status: statusCode });
  }
}
