import { getBattleMoment } from "@/lib/server/competitiveStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const moment = await getBattleMoment(id);

  if (!moment) {
    return Response.json(
      { message: "Battle moment not found" },
      { status: 404 },
    );
  }

  return Response.json(moment, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
