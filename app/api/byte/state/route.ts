import { actionJson } from "@/lib/actionsCors";
import { getByteRun, toByteState } from "@/lib/server/byteRuns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId") || url.searchParams.get("run_id") || "";
  if (!runId) {
    return actionJson(
      { error: "runId is required, e.g. /api/byte/state?runId=byte_abc123", status: "error" },
      { status: 400 },
    );
  }
  const run = getByteRun(runId);
  if (!run) {
    return actionJson(
      { error: `Unknown runId \"${runId}\". Start a run with POST /api/byte/start.`, status: "error" },
      { status: 404 },
    );
  }
  return actionJson(toByteState(run));
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
