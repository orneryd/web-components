const Parser = require('fastparse');

const attrsParser = new Parser({
  outside: {
    '<!--.*?-->': true,
    '<![CDATA[.*?]]>': true,
    '<[!\\?].*?>': true,
    '<\\/[^>]+>': true,
    '<([a-zA-Z\\-:]+)\\s*': function(match, tagName) {
      this.currentTag = tagName;
      return 'inside';
    },
  },
  inside: {
    '>': 'outside',
    '\\s+': true,
    '(([a-zA-Z0-9\\-:]+)\\s*=\\s*)([^\\s>]+)': function(match, end, name, value, index) {
      if (!this.tagAttr(this.currentTag, name)) return;
      this.results.push({
        start: index + end.length,
        length: value.length,
        value: value,
      });
    },
    '(([a-zA-Z0-9\\-:]+)\\s*=\\s*\')([^\']*)\'': function(match, end, name, value, index) {
      if (!this.tagAttr(this.currentTag, name)) return;
      this.results.push({
        start: index + end.length,
        length: value.length,
        value: value,
      });
    },
    '(([a-zA-Z0-9\\-:]+)\\s*=\\s*")([^"]*)"': function(match, end, name, value, index) {
      if (!this.tagAttr(this.currentTag, name)) return;
      this.results.push({
        start: index + end.length,
        length: value.length,
        value: value,
      });
    },
  },
});

module.exports = (html, tagAttr) => {
  return attrsParser.parse('outside', html, {
    currentTag: null,
    results: [],
    tagAttr,
  }).results;
};
