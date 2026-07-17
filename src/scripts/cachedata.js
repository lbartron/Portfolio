/* Helper function to check if session storage is available */
function isSessionStorageAvailable() {
  try {
    const testKey = "__storage_test__";
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

/* Generic read from cache. */
function getCachedData(key, ttlMs) {
  if(isSessionStorageAvailable()) {
    if(!key) return null;
    try {
      const data = sessionStorage.getItem(key); let obj = null;
      
      if(!data) {
        return null
      } else {
        obj = JSON.parse(data);
      }

      if((Date.now() - obj.timestamp) < ttlMs) {
        return obj.data;
      } else return null;
    } catch (err) {
      console.error("Get Cached Item failed:", err);
      return null;
    }
  } else {
    // TODO: Write fallback for session storage not being available
    // This may happen in incognito browsers
    return null;
  }
}

/* Generic write to cache. */
function setCachedData(key, data) {
  const jsonObj = {"timestamp":Date.now(), "data":data};
  const envelope = JSON.stringify(jsonObj);

  if(isSessionStorageAvailable()){
    try{
      sessionStorage.setItem(key, envelope);
    } catch (err) {
      console.error("Set Cached Item failed:", err);
    }
  } else {
    // TODO: Write fallback for session storage not being available
    // This may happen in incognito browsers
  }
}

/* Wrapper functions for build log github activity */
export function getCachedGitHubActivity() {
  const ttlMs = 1200000
  return getCachedData("githubActivity", ttlMs);
}

export function setCachedGitHubActivity(items) {
  setCachedData("githubActivity", items);
}

/* Wrapper functions for commit count */
export function getCachedCommitCount() {
  // 1 hour ttl since commit count fetch is expensive
  const ttlMs = 3600000
  return getCachedData("commitCount", ttlMs);
}

export function setCachedCommitCount(count) {
  setCachedData("commitCount", count);
}