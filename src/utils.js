/**
 * @param {String} path
 * @param {Object} obj Object to find the property in
 * @param {String} fb Fallback string when not found
 * @return {*|String} whatever the value from the nested key path is or the default string '${path}'.
 * @description Returns the value of an object via the path as a string
 *
 * @example
 * let result = getFromObj('hello.foo', {
 *  hello: {
 *    foo: 'bar'
 *  }
 * });
 *
 * result == 'bar';
 */
const keyRegexp = /^[\w-]+(\.[\w-]+)+$/g;
const getFromObj = (path, obj = {}) => {
  path = path && path.trim();
  if (path != null) {
    if (obj[path] != null) {
      return obj[path];
    } else if (keyRegexp.test(path)) {
      return path.split('.').reduce((res, key) => res[key] != null ? res[key] : path, obj);
    }
  }
  return path;
};


const thisRegex = /^[this|props]\./gi;
const nestedES6 = /\$\{.*(\$\{(.+?)\}).*\}/g;
const es6Regex = /\$\{(.+?)\}/g;
/**
* @param {String} expr The es6 expression
* @param {Options|Object} context the context object to find values for tokens.
* @return {String} The cleaned sxpression without the ${}.
* @description removes the ${} wrapping from an es6 template literal expression.
*/
const stripES6 = function(expr, context) {
  if (typeof expr !== 'string') return expr;
  es6Regex.lastIndex = 0;
  nestedES6.lastIndex = 0;
  let result = expr.replace(thisRegex, '');
  let matchArr;
  while (matchArr = nestedES6.exec(result)) {
    const [, outerMatch, key] = matchArr;
    const replacement = getFromObj(key, context);
    result = stripES6(result.replace(outerMatch, replacement).trim(), context);
  }
  return result.replace(es6Regex, (match, $1)=> getFromObj($1, context));
};

/**
* @param {String} tmpl the string template
* @param {Object} map Key/Value pairs to process the string against
* @param {String} fallback they string fallback when the value is missing.
* @return {*|String} whatever the value from the nested key path is or the default string '${path}'.
* @description Processes a string formatted like an ES6 template against an object
*
* @example
* let result = template('I am a string literal formatted ${message.label}.', {
*  message: {
*    label: 'to look like an ES6 template'
*  }
* });
*
* result == 'I am a string literal formatted to look like an ES6 template.';
*/
const template = stripES6;

/**
* @function arrayParser
* @param {Object} val the value to parse
* @param {String} key the name of the value to parse
* @param {Object} params all of the parameters that have been parsed so far.
* @return {Boolean} returns the currently parsed value.
* @description In the event that the search string has multiple values with the same key
* it will convert that into an array of those values for the given key.
*
* While there is no defined standard in [RFC 3986 Section 3.4]{@link https://tools.ietf.org/html/rfc3986#section-3.4},
* most web frameworks accept and serialize them in the following manner as outlined
* in [MSDN]{@link https://docs.microsoft.com/en-us/previous-versions/iis/6.0-sdk/ms524784(v=vs.90)}
*
* @example @lang js
* window.location.search = '?values=foo&values=bar&values=hello&values=world';
* const params = toParams(window.location.search, {});
* console.log(params) // {values: ["foo","bar","hello", "world"]}
*
* @example @lang js
* window.location.search = '?values=1&values=2&values=3&values=5&values=7';
* const params = toParams(window.location.search, {
*     values: parseInt
* });
* console.log(params) // {values: [1, 2, 3, 5, 7]}
*
* @example @lang js
* window.location.search = '?answer=42';
* const params = toParams(window.location.search, {
*     answer: parseInt
* });
* console.log(params) // {answer: 42}
*/
const arrayParser = (val, key, params) => {
  let current = params[key];
  if (current) {
    if (!Array.isArray(current)) {
      current = [current];
    }
    current.push(val);
  } else {
    current = val;
  }
  return current;
};

/**
* @function toParams
* @param {String} str
* @param {Object} options custom parser functions based on the key name
* @return {Object} seach params as an object
* @description Converts URL parameters to a Object collection of key/value pairs
* Decodes encoded url characters to back to normal strings.
* @example <caption>convert query string to object:</caption>
* import {toParams} from '@ornery/web-components';
* let paramsObject = toParams('?foo=bar&hello=world&hello=array&unsafe=I%20am%20an%20unsafe%20string');
*
* console.log(paramsObject) // { foo: 'bar', hello: ['world', 'array'], unsafe: 'I am an unsafe string'}
* @example <caption>pass an optional parser object</caption>
* import {toParams} from '@ornery/web-components';
* let paramsObject = toParams('?intvals=1&intvals=2&intvals=3', {
*     intvals: parseInt
* });
*
* console.log(paramsObject) // { intvals: [ 1, 2, 3 ] }
* @example <caption>without psassing an optional parser object</caption>
* import {toParams} from '@ornery/web-components';
* let paramsObject = toParams('?intvals=1&intvals=2&intvals=3');
*
* console.log(paramsObject) // { intvals: [ "1", "2", "3" ] }
*/
const toParams = (str, options = {}) => {
  const parts = str.split('?');
  const queryString = parts[1] || '';
  const params = {};
  queryString.split('&').forEach((val) => {
    const innerParts = val.split('=');
    if (innerParts.length !== 2) return;
    const paramKey = decodeURIComponent(innerParts[0]);
    const paramVal = decodeURIComponent(innerParts[1]);
    const parser = options[paramKey] || (() => paramVal);
    params[paramKey] = arrayParser(parser(paramVal, paramKey, params), paramKey, params);
  });
  return params;
};

/**
*
* @param {Object} options
* @param {String} base
* @return {String} the object represented as a query string.
* @description Converts an Object of String/Value pairs to a query string for URL parameters prepended with the "base" character.
* Encodes unsafe url characters to url safe encodings.
* @example <caption>convert object to query string</caption>
*
* import {toSearch} from '@ornery/web-components';
* let queryString = toSearch({
*  foo: 'bar',
*  hello: ['world', 'array'],
*  unsafe: 'I am an unsafe string'
*
* }, '#');
*
* queryString == '#?foo=bar&hello=world&hello=array&unsafe=I%20am%20an%20unsafe%20string';
*/
const toSearch = (options) => {
  const filtered = Object.entries(options).filter((ent) => !!ent[1]);
  return encodeURI(`?${filtered.map((ent) => {
    if (Array.isArray(ent[1])) {
      return ent[1].map((val) => [ent[0], val].join('=')).join('&');
    } else {
      return ent.join('=');
    }
  }).join('&')}`);
};

/**
*
* @param {Object} obj
* @param {String} prefix
* @return {Object} The new object with transformed keys.
* @description Convenience method that converts the keys of an object to have a prefix.
* This is faster than stringification.
*
* @example
* import {prefixKeys} from '@ornery/web-components';
* let newObj = prefixKeys({
*  foo: 'bar',
*  hello: ['world', 'array'],
*  unsafe: 'I am an unsafe string'
*
* }, 'zoo-');
*
* newObj == {
*   'zoo-foo': 'bar',
*   'zoo-hello': ['world', 'array']',
*   'zoo-unsafe': 'I am an unsafe string'
* };
*/
const prefixKeys = (obj, prefix) => {
  let keys = [];
  if (Array.isArray(obj)) {
    keys = obj.map((val, i) => i);
  } else {
    keys = Object.keys(obj);
  }
  return Object.assign(
      {},
      ...keys.map((key) => ({[prefix + key]: obj[key]})),
  );
};

/**
*
* @param {Object} obj
* @param {Boolean} stringify wether or not to stringify the values for each key.
* @return {Object} The new object with transformed keys.
* @description Convenience method that wraps prefixKeys with 'data-' for easier
* property spreading within other frameworks such as react.
* This is preferrable over stringifying objects as parsing json is slow in the browser
* @example <caption>React example</caption>
* const stringTestData = {
*  color: "black and white",
*  animal: "panda"
* };
*
* const MyComponent = (props) => {
*   const dataAttrs = toDataAttrs(stringTestData);
*   return (<div>
*     <div>
*       <i18n-message
*         data-key="tokenized.message"
*         {...dataAttrs}/>
*     </div>
*     <div>
*       <i18n-message
*         data-id="tokenized.message"
*         {...dataAttrs}
*         data-color="red"/>
*     </div>
*   </div>);
* };

const dataAttrs = toDataAttrs(stringTestData);
*/
const toDataAttrs = (obj) => {
  return prefixKeys(obj, 'data-');
};
const HTMLEncodable = /[\u00A0-\u9999<>]/g;
const encodeHTML = (stringVal = '') => stringVal.replace(HTMLEncodable, (i) => `&#${i.charCodeAt(0)};`);

const withClosing = /<([^>]+?)([^>]*?)>(.*?)<\/\1>/gi;
const selfClosing = /(<([^>]+)\/>)/ig;
const shouldEncode = (str) => (str || '').replace(withClosing, '').replace(selfClosing, '').trim();

const toLowerMap = (obj = {}) => {
  if (Array.isArray(obj)) {
    return obj.map(toLowerMap);
  }
  if (typeof obj === 'string') {
    return obj.toLowerCase();
  }
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const lck = key.toLowerCase();
    acc[lck] = toLowerMap(val);
    return acc;
  }, {});
};

module.exports = {
  getFromObj,
  template,
  stripES6,
  toParams,
  arrayParser,
  toSearch,
  prefixKeys,
  toDataAttrs,
  shouldEncode,
  encodeHTML,
  toLowerMap,
};
