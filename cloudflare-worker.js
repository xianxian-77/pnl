// 私有行情代理 (Cloudflare Worker) — 可选但强烈推荐, 免费且稳定
//
// 公共 CORS 代理经常抽风; 部署这个 10 行的 Worker 后, 行情就走你自己的代理, 不限量。
//
// 部署步骤 (一次性, 约 5 分钟):
//   1. 注册/登录 https://dash.cloudflare.com (免费套餐即可)
//   2. Workers & Pages → Create → Create Worker → 随便起个名字 → Deploy
//   3. Edit code → 全选删掉, 粘贴本文件全部内容 → Deploy
//   4. 得到地址 https://<名字>.<你的子域>.workers.dev
//   5. 回到 index.html 的「⚙️ 设置」→「自定义行情代理」填:
//        https://<名字>.<你的子域>.workers.dev/?url=
//      保存即可。分享链接时可勾选把它一起带给对方。
//
// 只允许转发 Yahoo Finance 行情接口, 不能被滥用为通用代理。

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target || !/^https:\/\/query[12]\.finance\.yahoo\.com\//.test(target)) {
      return new Response("bad target", { status: 400 });
    }
    const upstream = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
    });
  },
};
