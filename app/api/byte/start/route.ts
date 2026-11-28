import { actionJson } from "@/lib/actionsCors";
import { createByteRun, toByteState, type ByteDifficulty } from "@/lib/server/byteRuns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIFFS: ByteDifficulty[] = ["novice", "pirate", "captain", "admiral"];

export async function POST(request: Request) {
  try {
    let body: { agentName?: string; difficulty?: string; callsign?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }
    const agentName =
      (body.agentName || body.callsign || "ByteAgent").toString().slice(0, 32) || "ByteAgent";
    const difficulty: ByteDifficulty = DIFFS.includes(body.difficulty as ByteDifficulty)
      ? (body.difficulty as ByteDifficulty)
      : "pirate";
    const run = createByteRun(agentName, difficulty);
    return actionJson(toByteState(run));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start skirmish.";
    return actionJson({ error: message, status: "error" }, { status: 500 });
  }
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
