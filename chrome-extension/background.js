// Stores collected tweets per username, deduplicates by tweet ID.

const state = {}; // { username: { tweets: Tweet[], seenIds: Set<string> } }

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "TWEETS") return;

  const { username, tweets } = msg;
  if (!username || !Array.isArray(tweets) || tweets.length === 0) return;

  if (!state[username]) {
    state[username] = { tweets: [], seenIds: new Set() };
  }

  let added = 0;
  for (const tweet of tweets) {
    if (!tweet.id || state[username].seenIds.has(tweet.id)) continue;
    state[username].seenIds.add(tweet.id);
    state[username].tweets.push(tweet);
    added++;
  }

  if (added > 0) {
    // Persist to chrome.storage.local (survives popup close)
    const serialisable = Object.fromEntries(
      Object.entries(state).map(([u, v]) => [u, { tweets: v.tweets }])
    );
    chrome.storage.local.set({ collected: serialisable });
  }
});

// Expose state to popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    const summary = Object.fromEntries(
      Object.entries(state).map(([u, v]) => [u, v.tweets.length])
    );
    sendResponse({ summary, state });
    return true;
  }

  if (msg.type === "CLEAR") {
    const { username } = msg;
    if (username && state[username]) {
      delete state[username];
    } else if (!username) {
      Object.keys(state).forEach((k) => delete state[k]);
    }
    chrome.storage.local.set({ collected: {} });
    sendResponse({ ok: true });
    return true;
  }
});

// Restore persisted state on service worker start
chrome.storage.local.get(["collected"], (result) => {
  const saved = result.collected ?? {};
  for (const [username, data] of Object.entries(saved)) {
    state[username] = {
      tweets: data.tweets ?? [],
      seenIds: new Set((data.tweets ?? []).map((t) => t.id)),
    };
  }
});
