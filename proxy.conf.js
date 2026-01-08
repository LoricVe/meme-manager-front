const PROXY_CONFIG = {
  "/api": {
    target: "http://localhost:8055",
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    },
    logLevel: "debug",
    onProxyRes: function(proxyRes, req, res) {
      // Permet de gérer les cookies entre le proxy et le backend
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        proxyRes.headers['set-cookie'] = setCookie.map(cookie => {
          return cookie.replace(/; secure/gi, '');
        });
      }
    }
  }
};

module.exports = PROXY_CONFIG;
