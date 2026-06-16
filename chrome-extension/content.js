// Bridge between page context (injected.js) and the extension background worker.
// Injects injected.js into the page, then relays captured tweets to background.js.

(function () {
  // Inject the page-context script
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Listen for messages from injected.js
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
})();
