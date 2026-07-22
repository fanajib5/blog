// Markdown for Agents — content negotiation (Cloudflare Pages Function).
// When a request advertises `Accept: text/markdown`, serve the Hugo-generated
// Markdown representation of the page instead of the HTML. HTML stays the
// default for browser requests.
//
// Hugo emits Markdown next to each page (home -> /index.md, /about/ -> /about/index.md),
// so we fetch that artifact, set the correct content type, and add a rough
// token-count hint via the `x-markdown-tokens` response header.
//
// Note: Cloudflare also offers a native "Markdown for Agents" zone setting
// (developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).
// This middleware makes the behaviour explicit and repo-managed.

const SKIP_EXT =
  /\.(?:css|js|mjs|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|otf|pdf|xml|rss|atom|json|txt|wasm|zip)(?:\?.*)?$/i;

function estimateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function markdownPathFor(pathname) {
  if (pathname === "/" || pathname === "") return "/index.md";
  const clean = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return clean + "/index.md";
}

export const onRequest = async (context) => {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  if (SKIP_EXT.test(pathname)) return context.next();
  if (pathname.endsWith(".md")) return context.next();
  if (pathname.startsWith("/.well-known/")) return context.next();
  if (pathname.startsWith("/api/")) return context.next();

  const accept = (request.headers.get("accept") || "").toLowerCase();
  if (!accept.includes("text/markdown")) return context.next();

  const mdUrl = new URL(markdownPathFor(pathname), url.origin);
  try {
    const upstream = await fetch(mdUrl.toString(), { method: request.method });
    if (!upstream.ok) return context.next();
    const text = request.method === "HEAD" ? "" : await upstream.text();
    return new Response(request.method === "HEAD" ? null : text, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(estimateTokens(text)),
        vary: "Accept",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (err) {
    return context.next();
  }
};
