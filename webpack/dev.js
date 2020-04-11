const merge = require('webpack-merge');

const base = require('./base');
const { distPath } = require('./constants');

module.exports = merge(base, {
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
        path: distPath,
        filename: 'bundle.js',
    },
    devServer: {
        compress: true,
        host: '0.0.0.0',
        port: 9001,
        hot: true,
        open: true,
    },
});
