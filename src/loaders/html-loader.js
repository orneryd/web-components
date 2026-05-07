import { minify } from 'html-minifier-terser';
import attrParse from './attrs-parser.js';
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

const RUNTIME_HELPERS = `
const __idRe = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const __reserved = new Set(['props', 'arguments', 'this']);
function __render(__p, __body) {
  const keys = Object.keys(__p).filter((k) => __idRe.test(k) && !__reserved.has(k));
  const fn = new Function('props', ...keys, 'return \`' + __body + '\`');
  return fn.apply(__p, [__p, ...keys.map((k) => __p[k])]);
}
`;

const defaultOptions = {
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
};

/**
 * @function transformHTML
 * @param {String} content the HTML source content
 * @param {String} id the file path of the HTML file being transformed
 * @param {Object} options plugin options
 * @return {Promise<String>} the HTML content wrapped as an ESM module function
 * @description Transforms an HTML file into an ES module that exports a function.
 * That function takes a single argument (p shorthand for "props").
 *
 * We use the builtin DOMParser to parse the HTML template to reduce runtime dependencies.
 * The function ends with fn.call(p, p) which ensures that the es6 template context supports
 * both "this" and "props" within the template.
 *
 * ${this.myValue} and ${props.myValue} are treated identically and can be used interchangeably.
 *
 * @example @lang js <caption>vite.config.js</caption>
 * import { defineConfig } from 'vite';
 * import webComponents from '@ornery/web-components/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     webComponents({ include: /\.html$/ })
 *   ]
 * });
 *
 * @example @lang js <caption>webpack.config.js</caption>
 * import webComponents from '@ornery/web-components/webpack';
 *
 * export default {
 *   plugins: [
 *     webComponents({ include: /\.html$/ })
 *   ]
 * };
 *
 * @example @lang html <caption>example.html</caption>
 * <link src="./example.scss" />
 * <h3>${this.headerText}</h3>
 * <ul class="example-list">
 *     ${this.items.map(item => `<li class="example-list-item">${item}</li>`).join("")}
 * </ul>
 *
 * @example @lang js
 * import listTemplate from './example.html';
 * const fruits = ["apple", "orange", "banana"];
 *
 * const compiledDOMNodeArray = listTemplate({
 *   headerText: "List of fruits.",
 *   items: fruits
 * });
 */
export async function transformHTML(content, id, options = {}) {
  const config = { ...defaultOptions, ...options };
  const fileDir = path.dirname(id);

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
    if (link.value.indexOf('mailto:') > -1) return;

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
  content = content.replace(/on(\w+?)=["']\$\{(.+?)\}.*?["']/gmi, (m, cg1, cg2) => `on${cg1}="${cg2}"`);
  content = await minify(content, { ...config });
  content = content.replace(/\\"/g, '\\\\"');
  content = content.replace(/\\'/g, '\\\\\'');

  const linkregex = /<link[^>]+href=["']([^"']+?\.s?css)["'][^>]*>/gi;
  const imports = [...content.matchAll(linkregex)];
  const styleContent = imports.map((m) => {
    const filePath = path.resolve(fileDir, m[1]);
    if (fs.existsSync(filePath)) {
      content = content.replace(m[0], '');
      return sass.compile(filePath).css;
    }
    return '';
  }).join('\n');

  content = escapeBackticksOutsideInterpolation(content);
  const stylePrefix = styleContent ? `<style>${styleContent.replace(/`/g, '\\`')}</style>` : '';
  const body = JSON.stringify(stylePrefix + content);
  return `import {bindEvents, setupConnect} from "@ornery/web-components/templates";
${RUNTIME_HELPERS}
export default (p = {}) => {
  const parsed = new DOMParser().parseFromString(__render(p, ${body}), 'text/html');
  const elements = [...parsed.head.children, ...bindEvents(parsed.body, p).childNodes];
  return setupConnect(elements, p);
};
`;
}

function escapeBackticksOutsideInterpolation(str) {
  let out = '';
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '$' && str[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < str.length && depth > 0) {
        if (str[j] === '{') depth++;
        else if (str[j] === '}') depth--;
        if (depth === 0) break;
        j++;
      }
      out += str.slice(i, j + 1);
      i = j + 1;
    } else if (ch === '`') {
      out += '\\`';
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

export default transformHTML;
