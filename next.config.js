// next.config.js
const path = require('path')

module.exports = {
  // Static export — required for Electron production builds
  // (Electron loads files directly, there's no Next.js server)
  output: 'export',

  // Required when loading from file:// in Electron (no leading slash on assets)
  // In production Electron builds, all asset paths must be relative
  assetPrefix: process.env.ELECTRON_BUILD ? './' : '',

  // Disable Next.js image optimisation — it requires a server
  // Use a plain <img> tag (which you already do in index.html) or this config
  images: {
    unoptimized: true,
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
}