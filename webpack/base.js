const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { rootPath, distPath } = require('./constants');

module.exports = {
    entry: {
        app: path.join(rootPath, 'src', 'index.js'),
    },
    output: {
        path: distPath,
        filename: 'bundle.min.js',
    },
    resolve: {
        modules: [rootPath, 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: [/\.vert$/, /\.frag$/],
                use: 'raw-loader',
            },
            {
                test: /\.(gif|png|jpe?g|svg|xml)$/i,
                use: 'file-loader',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin([distPath], {
            root: rootPath,
        }),
        new webpack.DefinePlugin({
            CANVAS_RENDERER: JSON.stringify(true),
            WEBGL_RENDERER: JSON.stringify(true),
        }),
        new HtmlWebpackPlugin({
            template: path.join(rootPath, 'index.html'),
        }),
        new CopyWebpackPlugin([
            {
                from: path.join(rootPath, 'assets', '**', '*'),
                to: distPath,
            },
        ]),
    ],
};
