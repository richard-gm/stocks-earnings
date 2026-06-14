import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const url = process.env.KRONOS_API_URL;
  const key = process.env.KRONOS_API_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Kronos API not configured. Set KRONOS_API_URL and KRONOS_API_KEY." },
      { status: 503 }
    );
  }

  let ticker: string;
  try {
    const body = await req.json();
    ticker = (body.ticker as string)?.toUpperCase();
    if (!ticker) throw new Error("missing ticker");
  } catch {
    return NextResponse.json({ error: "Request body must be { ticker: string }" }, { status: 400 });
  }

  const res = await fetch(`${url}/score/stock`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: res.status });
  }

  const data = await res.json();

  revalidatePath("/");
  revalidatePath(`/${ticker}`);

  return NextResponse.json(data);
}
