const htmlMinifier = require('html-minifier');
const attrParse = require('./attrs-parser');
const loaderUtils = require('loader-utils');
const url = require('url');
const fs = require('fs');
const path = require('path');
const {compile} = require('es6-templates');

const templateWrapStart = 'const {bindEvents, setupConnect} = require("@ornery/web-components/templates"); module.exports = (p = {})=> { const parsed = new DOMParser().parseFromString(function(props){return ';
const templateWrapEnd = '}.call(p, p), \'text/html\'); const elements = [...parsed.head.children, ...bindEvents(parsed.body, p).childNodes]; return setupConnect(elements, p)}';

const getLoaderConfig = function(context) {
  const query = loaderUtils.getOptions(context) || {};
  const configKey = query.config || 'htmlLoader';
  const config = (context.options && context.options[configKey]) || {};
  return {...{
    minimize: true,
    removeComments: true,
    collapseWhitespace: true,
    exportAsEs6Default: true,
    attributes: [],
    interpolate: false,
    urlRoot: '',
    removeCommentsFromCDATA: true,
    removeCDATASectionsFromCDATA: true,
    conservativeCollapse: true,
    useShortDoctype: true,
    keepClosingSlash: true,
    removeScriptTypeAttributes: true,
    removeStyleTypeAttributes: true,
  }, ...query, ...config};
};

/**
 * @class htmlLoader
 * @param {String} content fileContent from webpack
 * @return {String} it returns the HTML content wrapped as a module function
 * @description The HTML file is converted into a module that exports a function.
 * That function takes a single argument (p shorthand for "props").
 * Also provides sass support by incliding a `link` tag in your html file to the scss file.
 *
 * We use the builtin DOMParser to parse the HTML template to reduce runtime dependencies.
 * an IIFE that takes a single argument (props) and returns the compiled template literal tring and passes
 * it into the DOMParser.parseFromString fn.
 *
 * The IIFE ends with fn.call(p, p) which ensures that the es6 template context supports
 * both "this" and "props" within the template.
 *
 * ${this.myValue} and ${props.myValue} are treated identically and can be used interchangably
 * For on*="" HTML5 event attributes, the loader replaces any ES6 syntax before babel conversion
 * to the es6 template literal. This way, the interaction between the on* events and the ContextBinding mixin
 * does not break. @see ContextBinding for more details.
 *
 * @example @lang js <caption>webpack.config.js</caption>
    {
      module: {
        rules: [
          {
            // set this to match the paths of the html files you want to import as functions.
            test: /web-components\/.+\.html$/,
            exclude: /node_modules/,
            use: [{
                loader: '@ornery/web-components/loader',
                options: {
                    minimize: true,
                    removeComments: true,
                    collapseWhitespace: true,
                    exportAsEs6Default: true,
                    attrs: false,
                    interpolate: false
                }
            }]
          }
        ]
      }
    }
 *
 * @example @lang scss <caption>example.scss</caption>
 * .example-list {
 *   padding: 0;
 *   margin: 0;
 *
 *   .example-list-item {
 *     line-height: 1rem;
 *     margin: .5rem;
 *   }
 * }
 *
 *
 * @example @lang html <caption>example.html</caption>
 * <link src="./example.scss" />
 * <h3>${this.headerText}</h3>
 * <ul class="example-list">
 *     ${this.items.map(item => `<li class="example-list-item">${item}</li>`).join("")}
 * </ul>
 *
 * @example @lang js
 * // becomes converted into:
 * const {bindEvents, setupConnect} = require("@ornery/web-components/templates");
 * module.exports = (p = {})=> {
 *   const parsed = new DOMParser().parseFromString(function(props){
 *   return "<style>.example-list{padding: 0;margin: 0;} .example-list .example-list-item{line-height: 1rem;margin: .5rem;}</style>" +
 *     "<h3>" + this.headerText + "</h3>" +
 *         "<ul>" +
 *     this.items.map(function(item){return "<li>" + item + "</li>"; })
 *                      .join("") +
 *         "</ul>"
 *   }.call(p, p), 'text/html');
 *
 *   const elements = [...parsed.head.children, ...bindEvents(parsed.body, p).childNodes];
 *   return setupConnect(elements, p)
 * }
 *
 * @example @lang js
 * import listTemplate from './example.html';
 * const fruits = ["apple", "orange", "banana"];
 *
 * const compiledDOMNodeArray = listTemplate({
 *   headerText: "List of fruits.",
 *   items: fruits
 * });
 *
 * console.log(compiledDOMNodeArray.length) // 2
 * console.log(compiledDOMNodeArray[0].tagName) // "h3"
 * console.log(compiledDOMNodeArray[0].innerHTML) // "List of fruits."
 * console.log(compiledDOMNodeArray[1].tagName) // "ul"
 * console.log(compiledDOMNodeArray[1].children[0].tagName) // "li"
 * console.log(compiledDOMNodeArray[1].children[0].innerHTML) // "apple"
 * console.log(compiledDOMNodeArray[1].children[1].tagName) // "li"
 * console.log(compiledDOMNodeArray[1].children[1].innerHTML) // "orange"
 * console.log(compiledDOMNodeArray[1].children[2].tagName) // "li"
 * console.log(compiledDOMNodeArray[1].children[2].innerHTML) // "banana"
 *
 *
 *
 */
const htmlLoader = function(content) {
  const config = getLoaderConfig(this);
  const links = attrParse(content, function(tag, attr) {
    const res = config.attributes.find(function(a) {
      if (a.charAt(0) === ':') {
        return attr === a.slice(1);
      } else {
        return (tag + ':' + attr) === a;
      }
    });
    return !!res;
  });
  links.reverse();
  const data = {};
  content = [content];
  links.forEach(function(link) {
    if (!loaderUtils.isUrlRequest(link.value, config.urlRoot)) return;

    if (link.value.indexOf('mailto:') > -1 ) return;

    const uri = url.parse(link.value);
    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null;
      link.value = uri.format();
      link.length = link.value.length;
    }
    let ident;
    while (data[ident]) {
      ident = '~~~HTMLLINK~~~' + Math.random() + Math.random() + '~~~';
    }
    data[ident] = link.value;
    const x = content.pop();
    content.push(x.substr(link.start + link.length));
    content.push(ident);
    content.push(x.substr(0, link.start));
  });
  content.reverse();
  content = content.join('');
  const linkregex = /^\s*<link.+href="(.+?s*css)".*>$/gmi;
  const imports = [...content.matchAll(linkregex)];
  content = content.replace(/on(\w+?)=["']\$\{(.+?)\}.*?["']/gmi, (m, cg1, cg2) => `on${cg1}="${cg2}"`);
  content = htmlMinifier.minify(content, {...config});
  content = content.replace(/\\"/g, '\\\\"');
  content = content.replace(/\\'/g, '\\\\\'');
  content = compile('`' + `<style>${imports.map((m)=>{
    if (typeof m[1] === 'string') {
      const filePath = path.resolve(this.context || '', m[1]);
      if (typeof filePath === 'string' && fs.existsSync(filePath)) {
        content = content.replace(m[0], '');
        return require('node-sass').renderSync({
          file: filePath,
        }).css.toString('utf8');
      }
    }
    return '';
  }).join('\n')}</style>\n` + content + '`').code;
  return `${templateWrapStart}${content}${templateWrapEnd}`;
};

module.exports = htmlLoader;
