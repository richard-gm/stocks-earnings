export const env = {
  tastytrade: {
    username: process.env.TASTYTRADE_USERNAME ?? null,
    password: process.env.TASTYTRADE_PASSWORD ?? null,
    baseUrl: process.env.TASTYTRADE_BASE_URL ?? "https://api.tastytrade.com",
  },
  fmpApiKey: process.env.FMP_API_KEY ?? null,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY ?? null,
  marketDataApiKey: process.env.MARKETDATA_API_KEY ?? null,
  isMockMode: !process.env.TASTYTRADE_USERNAME,
  twitterApiIoKey: process.env.TWITTERAPI_IO_KEY ?? null,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
  // Explicit model pin — override in .env.local only if you intentionally want a different model
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
};

if (typeof window === "undefined") {
  console.log(`[env] running in ${env.isMockMode ? "MOCK" : "LIVE"} mode`);
}
