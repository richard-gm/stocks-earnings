// Runs in the PAGE context (world: MAIN) — injected by Chrome directly, bypasses X's CSP.
// Patches window.fetch to intercept X's GraphQL UserTweets responses.

(function () {
  console.log("[XCollector] fetch interceptor active");

  const originalFetch = window.fetch;

  const isTweetEndpoint = (url) =>
    (url.includes("api.twitter.com") || url.includes("api.x.com") || url.includes("/i/api/")) &&
    (url.includes("UserTweets") || url.includes("UserTweetsAndReplies") || url.includes("UserMedia"));

  const isApiCall = (url) =>
    url.includes("api.twitter.com") || url.includes("api.x.com") || url.includes("/i/api/graphql");

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url =
        typeof args[0] === "string" ? args[0] : args[0]?.url ?? "";

      // Debug: log all X API calls so we can see what endpoints are being used
      if (isApiCall(url)) {
        console.log("[XCollector] API call:", url.split("?")[0]);
      }

      if (isTweetEndpoint(url)) {
        response
          .clone()
          .json()
          .then((data) => {
            const tweets = extractTweets(data);
            if (tweets.length > 0) {
              console.log(`[XCollector] captured ${tweets.length} tweets`);
              window.postMessage(
                { type: "XTWEETS_CAPTURED", tweets },
                "*"
              );
            } else {
              console.log("[XCollector] tweet endpoint hit but 0 tweets parsed — response:", JSON.stringify(data).slice(0, 300));
            }
          })
          .catch((e) => console.log("[XCollector] parse error:", e.message));
      }
    } catch {
      // never break the original fetch
    }

    return response;
  };

  function extractTweets(data) {
    const tweets = [];
    try {
      const instructions =
        data?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [];

      for (const instruction of instructions) {
        if (instruction.type !== "TimelineAddEntries") continue;
        for (const entry of instruction.entries ?? []) {
          // Top-level tweet
          tryPush(tweets, entry?.content?.itemContent?.tweet_results?.result);
          // Conversation thread items
          for (const item of entry?.content?.items ?? []) {
            tryPush(tweets, item?.item?.itemContent?.tweet_results?.result);
          }
        }
      }
    } catch {
      // silent
    }
    return tweets;
  }

  function tryPush(tweets, result) {
    if (!result || result.__typename === "TweetTombstone") return;
    try {
      const legacy = result?.legacy ?? result?.tweet?.legacy;
      const user =
        result?.core?.user_results?.result?.legacy ??
        result?.tweet?.core?.user_results?.result?.legacy;
      if (!legacy || !user) return;

      tweets.push({
        id: legacy.id_str,
        username: user.screen_name,
        displayName: user.name,
        text: legacy.full_text ?? legacy.text ?? "",
        createdAt: legacy.created_at,
        likeCount: legacy.favorite_count ?? 0,
        retweetCount: legacy.retweet_count ?? 0,
        replyCount: legacy.reply_count ?? 0,
        quoteCount: legacy.quote_count ?? 0,
        viewCount: result?.views?.count ?? null,
        isRetweet: !!legacy.retweeted_status_id_str,
        isReply: !!legacy.in_reply_to_screen_name,
        inReplyTo: legacy.in_reply_to_screen_name ?? null,
        lang: legacy.lang ?? null,
      });
    } catch {
      // skip malformed entry
    }
  }
})();
