const merge = require('webpack-merge');

const TerserPlugin = require('terser-webpack-plugin');

const base = require('./base');
const { distPath } = require('./constants');

module.exports = merge(base, {
    mode: 'production',
    devtool: false,
    output: {
        path: distPath,
        filename: 'bundle.min.js',
        publicPath: '/spaceGalaxy',
    },
    performance: {
        maxEntrypointSize: 900000,
        maxAssetSize: 900000,
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    },
});
