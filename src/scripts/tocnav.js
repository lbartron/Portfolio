document.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    root: null, 
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
  };

  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      // Find the corresponding TOC link using the heading's ID
      const id = entry.target.getAttribute("id");
      const tocLink = document.querySelector(`.toc-nav a[href="#${id}"]`);
      
      if (!tocLink) return;

      if (entry.isIntersecting) {
        // Remove active class from all links first to prevent duplicate highlights
        document.querySelectorAll(".toc-nav a").forEach((link) => {
          link.classList.remove("active");
        });
        // Highlight the current entry
        tocLink.classList.add("active");
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Track all main section headings
  const headings = document.querySelectorAll(".markdown-content h2, .markdown-content h3");
  headings.forEach((heading) => observer.observe(heading));
});