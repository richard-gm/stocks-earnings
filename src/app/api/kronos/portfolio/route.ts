import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST() {
  const url = process.env.KRONOS_API_URL;
  const key = process.env.KRONOS_API_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Kronos API not configured. Set KRONOS_API_URL and KRONOS_API_KEY." },
      { status: 503 }
    );
  }

  const res = await fetch(`${url}/score/portfolio`, {
    method: "POST",
    headers: { "X-Api-Key": key },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: res.status });
  }

  revalidatePath("/");

  const data = await res.json();
  return NextResponse.json(data, { status: 202 });
}
