import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { TTAuthResponse } from "./types";

let sessionToken: string | null = null;
let tokenExpiresAt = 0;

export async function getToken(): Promise<string> {
  if (sessionToken && Date.now() < tokenExpiresAt - 30 * 60 * 1000) {
    return sessionToken;
  }

  if (!env.tastytrade.username || !env.tastytrade.password) {
    throw new Error("TastyTrade credentials not configured");
  }

  logger.info(`[tastytrade] authenticating as ${env.tastytrade.username} → ${env.tastytrade.baseUrl}`);

  const res = await fetch(`${env.tastytrade.baseUrl}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: env.tastytrade.username,
      password: env.tastytrade.password,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error(`[tastytrade] auth failed: ${res.status} ${body}`);
    throw new Error(`TastyTrade auth failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as TTAuthResponse;
  sessionToken = data.data["session-token"];
  tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  logger.info(`[tastytrade] authenticated OK — token valid for 24h`);
  return sessionToken;
}

export async function ttFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${env.tastytrade.baseUrl}${path}`, {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`TastyTrade request failed: ${path} → ${res.status}`);
  }

  return res.json() as Promise<T>;
}
