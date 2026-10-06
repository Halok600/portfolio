import { defaultDeps, handlePredict, handleWarmup } from "@/lib/polyo-proxy";

// PolyO's free server can take about half a minute to wake up on the first request.
export const maxDuration = 60;

export function POST(req: Request) {
  return handlePredict(req, defaultDeps);
}

export function GET(req: Request) {
  return handleWarmup(req, defaultDeps);
}
