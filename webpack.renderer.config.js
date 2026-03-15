const rules = require('./webpack.rules');
const miniCss = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin")
const path = require("path")
const webpack = require('webpack');

let envs = require('dotenv').config().parsed;

module.exports = {

  optimization: {
      minimize: true,
      minimizer: [
        // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
        `...`,
        new CssMinimizerPlugin(),
      ],
  },

  // Put your normal webpack config below here
  module: {
    rules,
  },

  plugins: [
    new miniCss(),
    /*new CopyWebpackPlugin(
      [{ from: path.join("src", "images"), to: "images" }],
      {
        ignore: [".gitkeep"],
      }
    ),*/
    new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, './src/images'), to: "images" },
        ],
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(envs)
    }),
  ]
};
