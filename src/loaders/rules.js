const path = require('path');

module.exports = [
  {
    test: /\.scss$/,
    use: [
      'css-loader', // translates CSS into CommonJS
      'sass-loader', // compiles Sass to CSS, using Node Sass by default
    ],
  },
  {
    test: /\.html$/,
    use: [{
      loader: path.resolve(__dirname, '../loaders/html-loader.js'),
    }],
  },
];
