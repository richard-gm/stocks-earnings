// Runs in page context — intercepts X's GraphQL fetch calls to capture tweet data.
// Communicates back to content.js via window.postMessage.

(function () {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? "";
    if (
      url.includes("api.twitter.com") &&
      (url.includes("UserTweets") || url.includes("UserMedia") || url.includes("UserTweetsAndReplies"))
    ) {
      response
        .clone()
        .json()
        .then((data) => {
          const tweets = extractTweets(data);
          if (tweets.length > 0) {
            window.postMessage({ type: "XTWEETS_CAPTURED", tweets }, "*");
          }
        })
        .catch(() => {});
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
          // Standard tweet entry
          const tweetResult =
            entry?.content?.itemContent?.tweet_results?.result;
          if (tweetResult) {
            const t = parseTweetResult(tweetResult);
            if (t) tweets.push(t);
          }

          // Conversation thread entries (replies)
          const items = entry?.content?.items ?? [];
          for (const item of items) {
            const r = item?.item?.itemContent?.tweet_results?.result;
            if (r) {
              const t = parseTweetResult(r);
              if (t) tweets.push(t);
            }
          }
        }
      }
    } catch {
      // silent
    }
    return tweets;
  }

  function parseTweetResult(result) {
    try {
      // Handle tombstones / unavailable tweets
      if (result?.__typename === "TweetTombstone") return null;

      const legacy = result?.legacy ?? result?.tweet?.legacy;
      const user =
        result?.core?.user_results?.result?.legacy ??
        result?.tweet?.core?.user_results?.result?.legacy;

      if (!legacy || !user) return null;

      return {
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
      };
    } catch {
      return null;
    }
  }
})();
