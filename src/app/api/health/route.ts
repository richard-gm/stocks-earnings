import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    mode: env.isMockMode ? "mock" : "live",
    timestamp: new Date().toISOString(),
  });
}
