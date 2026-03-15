
const miniCss = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
      test: /\.html$/i,
      loader: 'underscore-template-loader',
  },

  {
      test: /\.scss$/,
      use: [
          miniCss.loader,
          {
              loader: 'css-loader',
              options: {}
          },
          {
              loader: 'resolve-url-loader',
              options: {}
          }, 
          {
              loader: 'sass-loader',
              options: {
                  sourceMap: true, // <-- !!IMPORTANT!!
                  sassOptions: {
                    // You might need to find the exact option name for silencing
                    // For Dart Sass, 'silenceDeprecations' is the modern way
                    // Let's assume it mirrors the Vite option for now
                    silenceDeprecations: ['import', 'color-functions', 'global-builtin', 'elseif', 'if-function']
                  }
              }
          }
      ]
  },

  /*{
    test: /\.(woff|woff2|ttf|otf|eot)$/,
    loader: 'file-loader',
    options: {
        name: '[name].[ext]',
    }
  }*/
  {
    test: /\.(svg|eot|woff|woff2|ttf)$/,
    type: 'asset/resource',
    generator: {
      //publicPath: '../fonts/',
      filename: 'compiled/fonts/[hash][ext][query]'
    }
  },
  {
    test: /\.(png|gif|jpg|svg)$/,
    type: 'asset/resource',
    generator: {
      //publicPath: '../fonts/',
      filename: 'compiled/images/[path]/[name][ext]'
    }
  },
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   loaders: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
