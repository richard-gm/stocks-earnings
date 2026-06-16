// Runs in the ISOLATED extension context.
// Listens for postMessage from intercept.js and forwards to background.js via chrome.runtime.

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "XTWEETS_CAPTURED") return;

  const username =
    window.location.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ??
    "unknown";

  chrome.runtime.sendMessage({
    type: "TWEETS",
    username,
    tweets: event.data.tweets,
  });
});

console.log("[XCollector] bridge ready on", window.location.pathname);
