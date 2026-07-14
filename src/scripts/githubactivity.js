document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".github-log");
  if (!container) return;

  const username = container.dataset.username;
  const repoColors = JSON.parse(container.dataset.repoColors || "{}");
  const list = container.querySelector(".github-log-list");

  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public`);
    if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);

    const events = await res.json();
    const pushes = events.filter((event) => event.type === "PushEvent").slice(0, 5);

    if (pushes.length === 0) {
      list.innerHTML = '<li class="github-log-error">No recent public activity found.</li>';
      return;
    }

    // allSettled so one failed lookup doesn't take down the whole feed.
    const lookups = await Promise.allSettled(
      pushes.map((event) =>
        fetch(`https://api.github.com/repos/${event.repo.name}/commits/${event.payload.head}`).then((r) => {
          if (!r.ok) throw new Error(`commit lookup failed: ${r.status}`);
          return r.json();
        })
      )
    );

    const items = pushes.map((event, i) => {
      const repoFullName = event.repo.name; // "owner/repo"
      const repoDisplayName = repoFullName.split("/").pop();
      const branch = event.payload.ref.replace("refs/heads/", "");
      const shortSha = event.payload.head.slice(0, 7);
      const timeAgo = getRelativeTime(new Date(event.created_at));
      const color = repoColors[repoFullName] || "var(--retro-navy)";

      const lookup = lookups[i];
      let message = `Pushed to ${branch}`;
      let url = `https://github.com/${repoFullName}/compare/${event.payload.before}...${event.payload.head}`;

      if (lookup.status === "fulfilled") {
        message = lookup.value.commit.message.split("\n")[0];
        url = lookup.value.html_url;
      }

      return { repoDisplayName, color, shortSha, timeAgo, message, url };
    });

    list.innerHTML = items
      .map(
        (item) => `
          <li class="github-log-item">
            <span class="repo-tag" style="color:${item.color}">${escapeHtml(item.repoDisplayName)}</span>
            <a class="commit-message" href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.message)}</a>
            <span class="commit-meta">${item.shortSha} · ${item.timeAgo}</span>
          </li>
        `
      )
      .join("");
  } catch (err) {
    list.innerHTML = '<li class="github-log-error">Couldn\'t load recent activity right now.</li>';
    console.error("Build log fetch failed:", err);
  }
});

function getRelativeTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const units = [
    { label: "y", secs: 31536000 },
    { label: "mo", secs: 2592000 },
    { label: "d", secs: 86400 },
    { label: "h", secs: 3600 },
    { label: "m", secs: 60 },
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.secs);
    if (count >= 1) return `${count}${unit.label} ago`;
  }
  return "just now";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}