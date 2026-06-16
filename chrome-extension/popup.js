let currentState = {};

function showStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2500);
}

function toCsv(tweets) {
  const header = [
    "id", "username", "displayName", "text", "createdAt",
    "likeCount", "retweetCount", "replyCount", "quoteCount",
    "viewCount", "isRetweet", "isReply", "inReplyTo", "lang",
  ];
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };
  const rows = tweets.map((t) => header.map((h) => escape(t[h])).join(","));
  return [header.join(","), ...rows].join("\n");
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderList(state) {
  currentState = state;
  const list = document.getElementById("list");
  const clearAll = document.getElementById("clearAll");
  const hint = document.getElementById("hint");
  const accounts = Object.entries(state);

  if (accounts.length === 0) {
    list.innerHTML = '<p class="empty">No tweets collected yet.<br/>Navigate to an X profile and scroll.</p>';
    clearAll.style.display = "none";
    hint.style.display = "block";
    return;
  }

  hint.style.display = "none";
  clearAll.style.display = "inline-block";

  list.innerHTML = accounts
    .sort((a, b) => b[1].tweets.length - a[1].tweets.length)
    .map(([username, data]) => {
      const count = data.tweets.length;
      return `
        <div class="account" data-user="${username}">
          <div class="account-header">
            <span class="account-name">@${username}</span>
            <span class="count">${count} tweet${count !== 1 ? "s" : ""}</span>
          </div>
          <div class="actions">
            <button class="primary export-csv" data-user="${username}">Export CSV</button>
            <button class="export-json" data-user="${username}">Export JSON</button>
            <button class="danger clear-user" data-user="${username}">Clear</button>
          </div>
        </div>`;
    })
    .join("");

  // CSV export
  list.querySelectorAll(".export-csv").forEach((btn) => {
    btn.addEventListener("click", () => {
      const u = btn.dataset.user;
      const tweets = currentState[u]?.tweets ?? [];
      download(`${u}_tweets.csv`, toCsv(tweets), "text/csv");
      showStatus(`Exported ${tweets.length} tweets for @${u}`);
    });
  });

  // JSON export
  list.querySelectorAll(".export-json").forEach((btn) => {
    btn.addEventListener("click", () => {
      const u = btn.dataset.user;
      const tweets = currentState[u]?.tweets ?? [];
      download(`${u}_tweets.json`, JSON.stringify(tweets, null, 2), "application/json");
      showStatus(`Exported ${tweets.length} tweets for @${u}`);
    });
  });

  // Clear single user
  list.querySelectorAll(".clear-user").forEach((btn) => {
    btn.addEventListener("click", () => {
      const u = btn.dataset.user;
      chrome.runtime.sendMessage({ type: "CLEAR", username: u }, () => refresh());
    });
  });
}

function refresh() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
    renderList(res?.state ?? {});
  });
}

document.getElementById("clearAll").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR" }, () => refresh());
});

// Initial load
refresh();
// Auto-refresh every 2s while popup is open
setInterval(refresh, 2000);
