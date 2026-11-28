import { actionJson } from "@/lib/actionsCors";
import { applyByteAction, getByteRun, toByteState } from "@/lib/server/byteRuns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID = ["move", "attack", "claim", "collect", "build", "end_turn", "quit"];

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return actionJson(
      { error: "Send JSON: { runId, action, ...params }. Valid actions: move, attack, claim, collect, build, end_turn, quit.", status: "error" },
      { status: 400 },
    );
  }
  const runId = String(body['runId'] || body['run_id'] || "");
  const action = String(body['action'] || "");
  if (!runId) {
    return actionJson({ error: "runId is required.", status: "error" }, { status: 400 });
  }
  if (!VALID.includes(action)) {
    return actionJson(
      { error: `Unknown action \"${action}\". Valid: ${VALID.join(", ")}.`, status: "error" },
      { status: 400 },
    );
  }
  const run = getByteRun(runId);
  if (!run) {
    return actionJson(
      { error: `Unknown runId \"${runId}\". Start with POST /api/byte/start.`, status: "error" },
      { status: 404 },
    );
  }
  const num = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const result = applyByteAction(run, action, {
    shipId: body['shipId'] !== undefined ? String(body['shipId']) : undefined,
    toX: num(body['toX'] ?? body['x']),
    toY: num(body['toY'] ?? body['y']),
    targetShipId: body['targetShipId'] !== undefined ? String(body['targetShipId']) : undefined,
    shipType: body['shipType'] !== undefined ? String(body['shipType']) : undefined,
    portX: num(body['portX']),
    portY: num(body['portY']),
    idempotencyKey: body['idempotencyKey'] !== undefined ? String(body['idempotencyKey']) : undefined,
  });
  // Errors in words, always with full state, always 200 so the agent can recover.
  return actionJson(toByteState(run, result.ok ? undefined : result.message));
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
