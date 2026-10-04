// Vercel entry: the whole Express app runs as one function. Static pages and
// assets in public/ are served by Vercel directly (see vercel.json).
const { createApp } = require('../server');

module.exports = createApp().app;
