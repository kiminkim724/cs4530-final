/* eslint-disable @typescript-eslint/no-var-requires */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/auth/**',
    createProxyMiddleware({
      target: 'http://localhost:8081/towns',
      changeOrigin: true,
    }),
  );
};
