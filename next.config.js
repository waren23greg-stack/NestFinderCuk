// next.config.js
const path = require('path');

module.exports = {
  turbopack: {
    root: path.resolve(__dirname) // optional, silences root warning
  }
};

