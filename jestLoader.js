const HtmlLoader = require('./src/loaders/html-loader');

module.exports = {
  process: (src) => HtmlLoader(src),
};
