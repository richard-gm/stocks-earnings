import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase().trim();

  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid ticker symbol" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Options flow requires a paid Polygon plan. Upgrade at polygon.io/pricing." },
    { status: 402 }
  );
}
