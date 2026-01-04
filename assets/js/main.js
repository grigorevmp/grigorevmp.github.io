(function () {
  const root = document.documentElement;

  // ===== Theme =====
  const THEME_KEY = "docs-theme";
  const btnTheme = document.getElementById("toggleTheme");

  function setTheme(t) {
    root.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) setTheme(savedTheme);

  btnTheme?.addEventListener("click", () => {
    const next = (root.dataset.theme === "dark") ? "light" : "dark";
    setTheme(next);
  });

  // ===== Progress bar + back to top =====
  const progressBar = document.getElementById("progressBar");
  const backToTop = document.getElementById("backToTop");

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const p = height > 0 ? (scrollTop / height) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;

    if (backToTop) {
      backToTop.style.opacity = scrollTop > 600 ? "1" : "0";
      backToTop.style.pointerEvents = scrollTop > 600 ? "auto" : "none";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ===== Heading anchors + TOC build =====
  const article = document.querySelector(".paper");
  const tocNav = document.getElementById("tocNav");

  function slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  if (article && tocNav) {
    const headings = Array.from(article.querySelectorAll("h2, h3"));

    const tocItems = [];
    headings.forEach((h) => {
      const text = h.textContent?.trim() || "";
      if (!text) return;

      if (!h.id) h.id = slugify(text);

      // anchor icon
      const a = document.createElement("a");
      a.className = "anchor";
      a.href = `#${h.id}`;
      a.setAttribute("aria-label", "Ссылка на раздел");
      a.textContent = "§";
      h.appendChild(a);

      tocItems.push({ id: h.id, text, level: h.tagName.toLowerCase() });
    });

    tocNav.innerHTML = tocItems
      .map((x) => {
        const cls = x.level === "h3" ? "toc__item toc__item--sub" : "toc__item";
        return `<a class="${cls}" href="#${x.id}">${x.text}</a>`;
      })
      .join("");

    // Active section highlight
    const links = Array.from(tocNav.querySelectorAll("a"));
    const map = new Map(links.map(l => [l.getAttribute("href")?.slice(1), l]));

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        links.forEach(l => l.classList.remove("is-active"));
        const active = map.get(id);
        active?.classList.add("is-active");
      });
    }, { rootMargin: "0px 0px -70% 0px", threshold: 0.1 });

    headings.forEach(h => obs.observe(h));
  }

  // ===== Search on page (Ctrl/⌘ + K) =====
  const searchInput = document.getElementById("searchInput");
  function focusSearch() {
    searchInput?.focus();
    searchInput?.select();
  }
  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const hotkey = isMac ? (e.metaKey && e.key.toLowerCase() === "k") : (e.ctrlKey && e.key.toLowerCase() === "k");
    if (hotkey) {
      e.preventDefault();
      focusSearch();
    }
  });

  function clearMarks() {
    const marks = document.querySelectorAll("mark.__find");
    marks.forEach(m => {
      const text = document.createTextNode(m.textContent || "");
      m.replaceWith(text);
    });
  }

  function markMatches(query) {
    if (!article) return;
    clearMarks();
    if (!query) return;

    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("pre, code")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const q = query.toLowerCase();
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((n) => {
      const text = n.nodeValue;
      if (!text) return;
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx < 0) return;

      const span = document.createElement("span");
      let start = 0;
      let pos = 0;
      while ((pos = lower.indexOf(q, start)) !== -1) {
        span.appendChild(document.createTextNode(text.slice(start, pos)));
        const mark = document.createElement("mark");
        mark.className = "__find";
        mark.textContent = text.slice(pos, pos + query.length);
        span.appendChild(mark);
        start = pos + query.length;
      }
      span.appendChild(document.createTextNode(text.slice(start)));
      n.parentNode?.replaceChild(span, n);
    });

    const first = document.querySelector("mark.__find");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  searchInput?.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    markMatches(v);
  });

  // ===== Reading time + word count =====
  function calcStats() {
    const el = document.querySelector(".paper");
    if (!el) return;
    const text = (el.textContent || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    const wc = document.getElementById("wordCount");
    const rt = document.getElementById("readingTime");
    if (wc) wc.textContent = `${words.toLocaleString("ru-RU")} слов`;
    if (rt) rt.textContent = `${minutes} мин чтения`;
  }
  calcStats();
})();
