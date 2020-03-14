const path = require('path');

const rootPath = path.resolve(__dirname, '..');
const distPath = path.join(rootPath, 'dist');

module.exports = { rootPath, distPath };
