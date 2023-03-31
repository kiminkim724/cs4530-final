const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/towns/auth/**',
    createProxyMiddleware({
      target: 'http://localhost:8081',
    }),
  );
};
