import { ACTIONS_CORS_HEADERS, actionJson } from "@/lib/actionsCors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

export function GET() {
  return actionJson({
    rules: [
      {
        pathPattern: "/",
        apiPath: "/api/actions/challenge",
      },
    ],
  });
}
