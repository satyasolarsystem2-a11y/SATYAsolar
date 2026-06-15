const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const target = (
    process.env.SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    ""
  ).trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!target || !anonKey) {
    console.error(
      "[PROXY] Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file.",
    );
    return;
  }

  console.log("[PROXY] Initialized successfully with target:", target);

  app.use(
    "/api/supabase",
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      pathRewrite: {
        "^/api/supabase": "",
      },
      onProxyReq: (proxyReq, req, res) => {
        // Inject the real Anon Key
        proxyReq.setHeader("apikey", anonKey);

        // Fix Authorization header if it uses the dummy key
        const auth = req.headers["authorization"];
        if (!auth || auth.includes("hidden-key")) {
          proxyReq.setHeader("Authorization", `Bearer ${anonKey}`);
        }
      },
    }),
  );
};
