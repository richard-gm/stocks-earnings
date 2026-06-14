import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const [hiddenRes, customRes] = await Promise.all([
      supabase.from("hidden_tickers").select("ticker"),
      supabase.from("custom_tickers").select("ticker, added_at"),
    ]);
    return Response.json({
      hidden: hiddenRes.data?.map((r) => r.ticker) ?? [],
      custom: customRes.data ?? [],
    });
  } catch {
    return Response.json({ hidden: [], custom: [] });
  }
}

export async function POST(request: Request) {
  const { ticker } = await request.json();
  const t = String(ticker ?? "").trim().toUpperCase();
  if (!t) return Response.json({ error: "ticker required" }, { status: 400 });

  try {
    const supabase = getSupabaseClient();
    await Promise.all([
      supabase.from("custom_tickers").upsert({ ticker: t }),
      supabase.from("hidden_tickers").delete().eq("ticker", t),
      supabase.from("portfolio_tickers").upsert({ ticker: t, source: "custom" }, { onConflict: "ticker" }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { ticker } = await request.json();
  const t = String(ticker ?? "").trim().toUpperCase();
  if (!t) return Response.json({ error: "ticker required" }, { status: 400 });

  try {
    const supabase = getSupabaseClient();
    await Promise.all([
      supabase.from("hidden_tickers").upsert({ ticker: t }),
      supabase.from("portfolio_tickers").delete().eq("ticker", t),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { ticker } = await request.json();
  const t = String(ticker ?? "").trim().toUpperCase();
  if (!t) return Response.json({ error: "ticker required" }, { status: 400 });

  try {
    const supabase = getSupabaseClient();
    await Promise.all([
      supabase.from("hidden_tickers").delete().eq("ticker", t),
      supabase.from("portfolio_tickers").upsert({ ticker: t, source: "analysis" }, { onConflict: "ticker" }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
