// Vercel Edge Middleware — gates everything under /admin/ with HTTP Basic Auth.
// Credentials live in Vercel env vars: ADMIN_USERNAME and ADMIN_PASSWORD.
// Set them in Project Settings → Environment Variables (and redeploy).

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export default function middleware(request) {
  const auth = request.headers.get("authorization");

  if (auth && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      const okUser = process.env.ADMIN_USERNAME;
      const okPass = process.env.ADMIN_PASSWORD;
      if (okUser && okPass && user === okUser && pass === okPass) {
        return; // authenticated — fall through to the static file
      }
    } catch {
      /* malformed header → fall through to 401 */
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sasha Grampone Admin", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
