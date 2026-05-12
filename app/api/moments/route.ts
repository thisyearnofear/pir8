import { recordBattleMoment } from "@/lib/server/competitiveStore";
import { GameState } from "@/types/game";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    gameState?: GameState;
    winnerPublicKey?: string;
  };

  if (!body.gameState) {
    return Response.json(
      { message: "gameState is required" },
      { status: 400 },
    );
  }

  const moment = await recordBattleMoment(
    body.gameState,
    body.winnerPublicKey,
  );

  return Response.json(moment, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
