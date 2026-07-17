import { getCachedCommitCount, setCachedCommitCount} from "./cachedata.js";

/* Use GitHub PAC during development */
const ghHeaders = import.meta.env.PUBLIC_GH_DEV_TOKEN
  ? { Authorization: `Bearer ${import.meta.env.PUBLIC_GH_DEV_TOKEN}` }
  : {};

document.addEventListener("DOMContentLoaded", async () => {
  const el = document.getElementById("commit-count");
  const container = document.querySelector(".project-numbers");
  if (!el || !container) return;

  const username = "lbartron";
  const displayName = "Leo Bartron";
  const repoNames = JSON.parse(container.dataset.repos || "[]");

  const cachedContent = getCachedCommitCount();
  if(cachedContent === null) {
    try {
      const uniqueShas = new Set();

      await Promise.all(
        repoNames.map(async (repoName) => {
          const branchesRes = await fetch(`https://api.github.com/repos/${repoName}/branches?per_page=100`, { headers: ghHeaders });
          if (!branchesRes.ok) return;
          const branches = await branchesRes.json();

          await Promise.all(
            branches.map(async (branch) => {
              const commitsRes = await fetch(
                `https://api.github.com/repos/${repoName}/commits?sha=${branch.name}&per_page=100`, { headers: ghHeaders }
              );
              if (!commitsRes.ok) return;
              const commits = await commitsRes.json();
              // Check if commit was done by me through an ssh connection
              // or under temporary credentials
              for (const commit of commits) {
                const isMine = commit.author?.login === username || commit.commit?.author?.name === displayName;
                if (isMine) uniqueShas.add(commit.sha);
              }
            })
          );
        })
      );
      // Cache retreived content to be used on page reload
      setCachedCommitCount(uniqueShas.size)

      el.textContent = `${uniqueShas.size}+`;
    } catch (err) {
      console.error("Commit count fetch failed:", err);
    }
  }else {
    el.textContent = `${cachedContent}+`;
  }  
});