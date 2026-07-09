// 离线壳 Service Worker — 缓存页面本身(网络优先, 断网回缓存), 行情/AI 请求一律不拦截
const CACHE = "pnl-shell-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(["./", "./index.html"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isShell = req.mode === "navigate" || url.pathname.endsWith("/index.html");
  if (!isShell) return; // 行情/AI/代理请求直连网络, 不缓存
  // 网络优先: 永远先要最新页面(顺带解决"传了新版看到旧版"的缓存问题), 断网才回缓存壳
  e.respondWith(
    fetch(req).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put("./index.html", cp)).catch(() => {});
      return r;
    }).catch(() =>
      caches.match("./index.html").then(m => m || caches.match("./"))
    )
  );
});
