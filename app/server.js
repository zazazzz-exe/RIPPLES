const path = require('node:path');
const express = require('express');
const config = require('./src/config');
const { createServices } = require('./src/services');
const { createApi } = require('./src/api');

function createApp(cfg = config, opts) {
  const services = createServices(cfg, opts);
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
    next();
  });
  app.use('/api', createApi(services));
  app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
  return { app, services };
}

if (require.main === module) {
  const { app, services } = createApp();
  app.listen(config.port, () => {
    console.log(`Ripples web app: http://localhost:${config.port}  (approval mode: ${services.drafts.mode}, sample data)`);
  });
}

module.exports = { createApp };
