## Classes

<dl>
<dt><a href="#htmlLoader">htmlLoader</a></dt>
<dd></dd>
<dt><a href="#ContextBinding">ContextBinding</a></dt>
<dd></dd>
<dt><a href="#DataStore">DataStore</a></dt>
<dd></dd>
<dt><a href="#EventMap">EventMap</a></dt>
<dd></dd>
<dt><a href="#I18nMessage">I18nMessage</a></dt>
<dd></dd>
<dt><a href="#I18n">I18n</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#bindEvents">bindEvents(root, context)</a> ⇒ <code>HTMLElement</code></dt>
<dd><p>helper function used by the loader when importing html files as a template fucntion
for using attributes such as &quot;onclick&quot; within your html templates.
You do not need to call this yourself if you are importing your html files using the loader</p>
</dd>
<dt><a href="#getFromObj">getFromObj(path, obj, fb)</a> ⇒ <code>*</code> | <code>String</code></dt>
<dd><p>Returns the value of an object via the path as a string</p>
</dd>
<dt><a href="#template">template(tmpl, map, fallback)</a> ⇒ <code>*</code> | <code>String</code></dt>
<dd><p>Processes a string formatted like an ES6 template against an object</p>
</dd>
<dt><a href="#stripES6">stripES6(expr, context)</a> ⇒ <code>String</code></dt>
<dd><p>removes the ${} wrapping from an es6 template literal expression.</p>
</dd>
<dt><a href="#arrayParser">arrayParser(val, key, params)</a> ⇒ <code>Boolean</code></dt>
<dd><p>In the event that the search string has multiple values with the same key
it will convert that into an array of those values for the given key.</p>
<p>While there is no defined standard in <a href="https://tools.ietf.org/html/rfc3986#section-3.4">RFC 3986 Section 3.4</a>,
most web frameworks accept and serialize them in the following manner as outlined
in <a href="https://docs.microsoft.com/en-us/previous-versions/iis/6.0-sdk/ms524784(v=vs.90)">MSDN</a></p>
</dd>
<dt><a href="#toParams">toParams(str, options)</a> ⇒ <code>Object</code></dt>
<dd><p>Converts URL parameters to a Object collection of key/value pairs
Decodes encoded url characters to back to normal strings.</p>
</dd>
<dt><a href="#toSearch">toSearch(options, base)</a> ⇒ <code>String</code></dt>
<dd><p>Converts an Object of String/Value pairs to a query string for URL parameters prepended with the &quot;base&quot; character.
Encodes unsafe url characters to url safe encodings.</p>
</dd>
<dt><a href="#prefixKeys">prefixKeys(obj, prefix)</a> ⇒ <code>Object</code></dt>
<dd><p>Convenience method that converts the keys of an object to have a prefix.
This is faster than stringification.</p>
</dd>
<dt><a href="#toDataAttrs">toDataAttrs(obj, stringify)</a> ⇒ <code>Object</code></dt>
<dd><p>Convenience method that wraps prefixKeys with &#39;data-&#39; for easier
property spreading within other frameworks such as react.
This is preferrable over stringifying objects as parsing json is slow in the browser</p>
</dd>
</dl>

<a name="htmlLoader"></a>

## htmlLoader
**Kind**: global class  
<a name="new_htmlLoader_new"></a>

### new htmlLoader(content)
The HTML file is converted into a module that exports a function.
That function takes a single argument (p shorthand for "props").
Also provides sass support by incliding a `link` tag in your html file to the scss file.

We use the builtin DOMParser to parse the HTML template to reduce runtime dependencies.
an IIFE that takes a single argument (props) and returns the compiled template literal tring and passes
it into the DOMParser.parseFromString fn.

The IIFE ends with fn.call(p, p) which ensures that the es6 template context supports
both "this" and "props" within the template.

${this.myValue} and ${props.myValue} are treated identically and can be used interchangably
For on*="" HTML5 event attributes, the loader replaces any ES6 syntax before babel conversion
to the es6 template literal. This way, the interaction between the on* events and the ContextBinding mixin
does not break. @see ContextBinding for more details.

**Returns**: <code>String</code> - it returns the HTML content wrapped as a module function  

| Param | Type | Description |
| --- | --- | --- |
| content | <code>String</code> | fileContent from webpack |

**Example** *(webpack.config.js)*  
```js
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
```
**Example** *(example.scss)*  
```scss
.example-list {
  padding: 0;
  margin: 0;

  .example-list-item {
    line-height: 1rem;
    margin: .5rem;
  }
}
```
**Example** *(example.html)*  
```html
<link src="./example.scss" />
<h3>${this.headerText}</h3>
<ul class="example-list">
    ${this.items.map(item => `<li class="example-list-item">${item}</li>`).join("")}
</ul>
```
**Example**  
```js
// becomes converted into:
const {bindEvents, setupConnect} = require("@ornery/web-components/templates");
module.exports = (p = {})=> {
  const parsed = new DOMParser().parseFromString(function(props){
  return "<style>.example-list{padding: 0;margin: 0;} .example-list .example-list-item{line-height: 1rem;margin: .5rem;}</style>" +
    "<h3>" + this.headerText + "</h3>" +
        "<ul>" +
    this.items.map(function(item){return "<li>" + item + "</li>"; })
                     .join("") +
        "</ul>"
  }.call(p, p), 'text/html');

  const elements = [...parsed.head.children, ...bindEvents(parsed.body, p).childNodes];
  return setupConnect(elements, p)
}
```
**Example**  
```js
import listTemplate from './example.html';
const fruits = ["apple", "orange", "banana"];

const compiledDOMNodeArray = listTemplate({
  headerText: "List of fruits.",
  items: fruits
});

console.log(compiledDOMNodeArray.length) // 2
console.log(compiledDOMNodeArray[0].tagName) // "h3"
console.log(compiledDOMNodeArray[0].innerHTML) // "List of fruits."
console.log(compiledDOMNodeArray[1].tagName) // "ul"
console.log(compiledDOMNodeArray[1].children[0].tagName) // "li"
console.log(compiledDOMNodeArray[1].children[0].innerHTML) // "apple"
console.log(compiledDOMNodeArray[1].children[1].tagName) // "li"
console.log(compiledDOMNodeArray[1].children[1].innerHTML) // "orange"
console.log(compiledDOMNodeArray[1].children[2].tagName) // "li"
console.log(compiledDOMNodeArray[1].children[2].innerHTML) // "banana"
```
<a name="ContextBinding"></a>

## ContextBinding
**Kind**: global class  

* [ContextBinding](#ContextBinding)
    * [new ContextBinding(superclass)](#new_ContextBinding_new)
    * [.getAttribute(attrKey)](#ContextBinding.getAttribute) ⇒ <code>String</code>
    * [.setAttribute(attrKey, attrVal)](#ContextBinding.setAttribute)

<a name="new_ContextBinding_new"></a>

### new ContextBinding(superclass)
helper mixins for parsing data-* attributes as json objects via get/setAttribute.


| Param | Type | Description |
| --- | --- | --- |
| superclass | <code>class</code> | inheriting class |

**Example**  
```js
//import the ContextBinding mixin
import ContextBinding from 'mck-webcomponents/lib/context-binding';

// define your custom element.
export default class ListComponent extends HTMLElement {
  constructor(self) {
    super(self);
    self = this;
  }

  connectedCallback() {
      this.shadowRoot.innerHTML = "";
      // ContextBinding allows you to access data-* attributes as JSON objects with or without the "data-" prefix.
      let items = this.getAttribute('items');
      listTemplate({
          items,
     }).forEach((node) => this.shadowRoot.appendChild(node));
  }
}

// Before registering, apply the mixin to your class.
customElements.define('list-component', ContextBinding(MainComponent));
```
**Example**  
```html
<!-- Usage in raw HTML -->
<list-component data-items="['apple','orange','banana']" selected-item="apple"></list-component>
```
<a name="ContextBinding.getAttribute"></a>

### ContextBinding.getAttribute(attrKey) ⇒ <code>String</code>
If using data-attributes, it will handle the string->JSON conversion for you.
You may reference the data-* attributes with or without the data- prefix for convenience.

**Kind**: static method of [<code>ContextBinding</code>](#ContextBinding)  
**Returns**: <code>String</code> - current attribute value.  

| Param | Type |
| --- | --- |
| attrKey | <code>String</code> | 

<a name="ContextBinding.setAttribute"></a>

### ContextBinding.setAttribute(attrKey, attrVal)
If using data-attributes, it will handle the JSON->string conversion for you when
the value to set is not a string.
You may reference the data-* attributes with or without the data- prefix for convenience.
Bubbles up the attributeChangedCallback to your class when values are set.

**Kind**: static method of [<code>ContextBinding</code>](#ContextBinding)  

| Param | Type | Description |
| --- | --- | --- |
| attrKey | <code>String</code> | the attribute key to set. |
| attrVal | <code>String</code> \| <code>\*</code> | the value to set the attribute to. |

<a name="DataStore"></a>

## DataStore
**Kind**: global class  

* [DataStore](#DataStore)
    * [new DataStore()](#new_DataStore_new)
    * [.get(key)](#DataStore.get) ⇒ <code>Object</code>
    * [.getState()](#DataStore.getState) ⇒ <code>Object</code>
    * [.set(key, value)](#DataStore.set) ⇒ <code>Object</code> \| <code>\*</code>
    * [.setState(newState)](#DataStore.setState) ⇒ <code>Object</code> \| <code>\*</code>
    * [.subscribe(callback)](#DataStore.subscribe) ⇒ <code>Object</code> \| <code>\*</code>
    * [.subscribeTo(keys, callback)](#DataStore.subscribeTo) ⇒ <code>Object</code> \| <code>\*</code>

<a name="new_DataStore_new"></a>

### new DataStore()
Configuration values can be set and propagated to consuming
components via this static class or through
the corresponding wc-config element

<a name="DataStore.get"></a>

### DataStore.get(key) ⇒ <code>Object</code>
**Kind**: static method of [<code>DataStore</code>](#DataStore)  
**Returns**: <code>Object</code> - the current value of the requested property name.  

| Param | Type |
| --- | --- |
| key | <code>String</code> | 

<a name="DataStore.getState"></a>

### DataStore.getState() ⇒ <code>Object</code>
**Kind**: static method of [<code>DataStore</code>](#DataStore)  
**Returns**: <code>Object</code> - the current state object.  
<a name="DataStore.set"></a>

### DataStore.set(key, value) ⇒ <code>Object</code> \| <code>\*</code>
wraps this.set

**Kind**: static method of [<code>DataStore</code>](#DataStore)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> \| <code>Object</code> | the name of the value to set. It can also be called with an {} query to set multiple values at once. |
| value | <code>\*</code> | the value of the property to set it to. |

<a name="DataStore.setState"></a>

### DataStore.setState(newState) ⇒ <code>Object</code> \| <code>\*</code>
wraps this.set

**Kind**: static method of [<code>DataStore</code>](#DataStore)  

| Param | Type | Description |
| --- | --- | --- |
| newState | <code>Object</code> | the new state object. |

<a name="DataStore.subscribe"></a>

### DataStore.subscribe(callback) ⇒ <code>Object</code> \| <code>\*</code>
call destroy() on the returned object to remove the event listener.

**Kind**: static method of [<code>DataStore</code>](#DataStore)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | is the function to execute when any property changes. |

<a name="DataStore.subscribeTo"></a>

### DataStore.subscribeTo(keys, callback) ⇒ <code>Object</code> \| <code>\*</code>
call destroy() on the returned object to remove the event listener.

**Kind**: static method of [<code>DataStore</code>](#DataStore)  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>Array</code> | the property names to be notified when they mutate |
| callback | <code>function</code> | the callback to be executed when any of the value for any of those keys have changed. |

<a name="EventMap"></a>

## EventMap
**Kind**: global class  

* [EventMap](#EventMap)
    * [new EventMap()](#new_EventMap_new)
    * [.module.exports#on(event, callback)](#EventMap.module.exports+on) ⇒ <code>Object</code>
    * [.module.exports#set(key, val, notify)](#EventMap.module.exports+set) ⇒ [<code>EventMap</code>](#EventMap)
    * [.module.exports#replace(keyValuePairs, notify)](#EventMap.module.exports+replace) ⇒ [<code>EventMap</code>](#EventMap)
    * [.module.exports#del(key, notify)](#EventMap.module.exports+del) ⇒ [<code>EventMap</code>](#EventMap)
    * [.module.exports#clear(notify)](#EventMap.module.exports+clear) ⇒ <code>Object</code>
    * [.module.exports#getAll()](#EventMap.module.exports+getAll) ⇒ <code>Object</code>

<a name="new_EventMap_new"></a>

### new EventMap()
provides an event bus for when properties of the underlying Map change.

<a name="EventMap.module.exports+on"></a>

### EventMap.module.exports#on(event, callback) ⇒ <code>Object</code>
call the destroy() function ont he returned object to remove the event listener

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: <code>Object</code> - with the subscriber function, the event name, and a destroy function.  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>String</code> | 'set'= after the property has been set |
| callback | <code>function</code> | notification channel |

<a name="EventMap.module.exports+set"></a>

### EventMap.module.exports#set(key, val, notify) ⇒ [<code>EventMap</code>](#EventMap)
call set() set the value for a given key in the map.

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: [<code>EventMap</code>](#EventMap) - this eventmap instance.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> |  |
| val | <code>Object</code> \| <code>Array</code> |  |
| notify | <code>Boolean</code> | set false to NOT notify subscribers. |

<a name="EventMap.module.exports+replace"></a>

### EventMap.module.exports#replace(keyValuePairs, notify) ⇒ [<code>EventMap</code>](#EventMap)
call replace() to replace the existing state.

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: [<code>EventMap</code>](#EventMap) - this eventmap instance.  

| Param | Type | Description |
| --- | --- | --- |
| keyValuePairs | <code>Object</code> |  |
| notify | <code>Boolean</code> | set false to NOT notify subscribers. |

<a name="EventMap.module.exports+del"></a>

### EventMap.module.exports#del(key, notify) ⇒ [<code>EventMap</code>](#EventMap)
call del() to remove a value from the map.

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: [<code>EventMap</code>](#EventMap) - this eventmap instance.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | the key to remove from the map. |
| notify | <code>Boolean</code> | set false to NOT notify subscribers. |

<a name="EventMap.module.exports+clear"></a>

### EventMap.module.exports#clear(notify) ⇒ <code>Object</code>
call clear() to remove all the key/value entries from the map.

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: <code>Object</code> - object hash of all the key value pairs.  

| Param | Type | Description |
| --- | --- | --- |
| notify | <code>Boolean</code> | set false to NOT notify subscribers. |

<a name="EventMap.module.exports+getAll"></a>

### EventMap.module.exports#getAll() ⇒ <code>Object</code>
call getAll() to retrieve the current set of key/value pairs.

**Kind**: static method of [<code>EventMap</code>](#EventMap)  
**Returns**: <code>Object</code> - object hash of all the key value pairs.  
<a name="I18nMessage"></a>

## I18nMessage
**Kind**: global class  
<a name="new_I18nMessage_new"></a>

### new I18nMessage(key, values, dataAttributes)
<i18n-message> HTML element. Provides tranlsation and interpolation for
translatable strings


| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the key for the strings based on current language. can be set as the innerHTML or defined as the attibutes: key, id, data-key, data-id |
| values | <code>JSON</code> | can be passed as data-* attributes or as a json-parseable object string as "data-values" |
| dataAttributes | <code>String</code> |  |

**Example** *(Given the following configuration)*  
```js
import { I18n } from '@ornery/web-components';
I18n.addMessages('en-US', {
 'translatable.message.name': "I'm a translated string from i18n",
  'tokenized.message': "I have a ${color} ${animal}"
});
```
**Example** *(With the following usage)*  
```html
<i18n-message>translatable.message.name</i18n-message>
<div>
   <i18n-message data-values="{'color: 'grey', 'animal': 'monkey'}">tokenized.message</i18n-message>
   <i18n-message data-color="grey" data-animal="monkey">tokenized.message</i18n-message>
   <i18n-message key="tokenized.message"/>
   <!-- React does not pass key or ref props so you can use "data-key" or "data-id" as well-->
   <i18n-message data-key="tokenized.message"/>
   <i18n-message id="translatable.message.name"/>
   <i18n-message data-id="translatable.message.name"/>
</div>
```
**Example** *(Renders the HTML)*  
```html
<i18n-message>I'm a translated string from i18n</i18n-message>
<i18n-message>I have a grey monkey</i18n-message>
```
<a name="I18n"></a>

## I18n
**Kind**: global class  

* [I18n](#I18n)
    * [new I18n()](#new_I18n_new)
    * [.getLang()](#I18n.getLang) ⇒ <code>String</code>
    * [.setLang(lang)](#I18n.setLang)
    * [.getMessages()](#I18n.getMessages) ⇒ <code>String</code>
    * [.setMessages(values)](#I18n.setMessages)
    * [.addMessages(lang, strings)](#I18n.addMessages)
    * [.get(key, data)](#I18n.get) ⇒ <code>String</code>
    * [.getAll(namespace)](#I18n.getAll) ⇒ <code>Object</code>

<a name="new_I18n_new"></a>

### new I18n()
Import strings here and call I18n.addStrings() with the supported locale identifier
and the strings object exported from the language file
By default, it will set the values on window.i18n, if defined when loaded, as the starting messages.
This is useful if you wish to server-side render HTML certain content before laoding scripts on the client.

**Example**  
```js
import { I18n } from '@ornery/web-components';

I18n.addMessages('en-US', {
    'translatable.message.name': "I'm a translated string from i18n",
    'tokenized.message': "I have a ${this.color} ${this.animal}"
});
```
**Example**  
```js
window.i18n = {
    'en-US': {
        'translatable.message.name': "I'm a translated string from i18n",
        'tokenized.message': "I have a ${this.color} ${this.animal}"
    }
}

import { I18n } from '@ornery/web-components';

console.log(I18n.getMessages()) // will log the window.i18n object
```
<a name="I18n.getLang"></a>

### I18n.getLang() ⇒ <code>String</code>
returns the current language. defaults to the browser's navigator.language value.

**Kind**: static method of [<code>I18n</code>](#I18n)  
**Returns**: <code>String</code> - lang  
**Example**  
```js
navigator.language = 'en-US';
import { I18n } from '@ornery/web-components';

console.log(I18n.getLang()) // "en-US"
```
<a name="I18n.setLang"></a>

### I18n.setLang(lang)
sets the current i18n language. This does not change the browser language.

**Kind**: static method of [<code>I18n</code>](#I18n)  

| Param | Type |
| --- | --- |
| lang | <code>String</code> | 

**Example**  
```js
import { I18n } from '@ornery/web-components';

I18n.setLang('en-US')
console.log(I18n.getLang()) //'en-US'
```
<a name="I18n.getMessages"></a>

### I18n.getMessages() ⇒ <code>String</code>
returns the current i18n messages set in the DataManager

**Kind**: static method of [<code>I18n</code>](#I18n)  
**Returns**: <code>String</code> - lang  
<a name="I18n.setMessages"></a>

### I18n.setMessages(values)
sets the strings as a whole. This overrides all existing strings.
Use addMessages to add more strings to the existing set.

**Kind**: static method of [<code>I18n</code>](#I18n)  

| Param | Type |
| --- | --- |
| values | <code>Object</code> | 

**Example**  
```js
import { I18n } from '@ornery/web-components';

I18n.setMessages({
    'en-US': {
        'translatable.message.name': "I'm a translated string from i18n",
        'tokenized.message': "I have a ${this.color} ${this.animal}"
    }
})
```
<a name="I18n.addMessages"></a>

### I18n.addMessages(lang, strings)
add more strings to the existing language set.

**Kind**: static method of [<code>I18n</code>](#I18n)  

| Param | Type |
| --- | --- |
| lang | <code>String</code> | 
| strings | <code>Object</code> | 

**Example**  
```js
import { I18n } from '@ornery/web-components';
I18n.addMessages('en-US', {
 'translatable.message.name': "I'm a translated string from i18n",
  'tokenized.message': "I have a ${color} ${animal}"
});
```
<a name="I18n.get"></a>

### I18n.get(key, data) ⇒ <code>String</code>
Returns the value for the key. If a context is provided as the second argument for tokens,
the tokens will be replaced in the returned string.

**Kind**: static method of [<code>I18n</code>](#I18n)  
**Returns**: <code>String</code> - Returns the value for the key. Processed if a data context is provided as the second argument.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | they key of the string to retrieve from the current language set. |
| data | <code>Object</code> | Optional, The data to process tokens in the string with. |

**Example**  
```js
import { I18n } from '@ornery/web-components';
I18n.addMessages('en-US', {
  'tokenized.message': "I have a ${color} ${animal}"
});

const stringTestData = {
    color: "grey",
    animal: "monkey"
};
console.log(I18n.get('tokenized.message', stringTestData)) // "I have a grey monkey"
```
<a name="I18n.getAll"></a>

### I18n.getAll(namespace) ⇒ <code>Object</code>
If a namespace is provided, returns all the key value pairs for that
namespace without the namespace in the keys.

**Kind**: static method of [<code>I18n</code>](#I18n)  
**Returns**: <code>Object</code> - Returns all the messages for the given language. Filtered to namespace if provided.  

| Param | Type |
| --- | --- |
| namespace | <code>String</code> | 

**Example**  
```js
import { I18n } from '@ornery/web-components';
I18n.addMessages('en-US', {
 'translatable.message.name': "I'm a translated string from i18n",
  'tokenized.message': "I have a ${color} ${animal}"
});

console.log(I18n.getAll('tokenized')) // {"message": "I have a ${color} ${animal}"}
```
<a name="bindEvents"></a>

## bindEvents(root, context) ⇒ <code>HTMLElement</code>
helper function used by the loader when importing html files as a template fucntion
for using attributes such as "onclick" within your html templates.
You do not need to call this yourself if you are importing your html files using the loader

**Kind**: global function  
**Returns**: <code>HTMLElement</code> - the root element passed in.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>HTMLElement</code> | The root element to find all elements from. |
| context | <code>Object</code> | the context object for finding functions to bind against. default is the root element |

**Example**  
```js
The event handler method signature is the exact same as standard HTML5 event handlers.
[standard HTML5 event handlers](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).

Supported html5 events:
[onabort], [onafterprint], [onbeforeonload], [onbeforeprint], [onblur], [oncanplay], [oncanplaythrough], [onchange],
[onclick], [oncontextmenu], [ondblclick], [ondrag], [ondragend], [ondragenter], [ondragleave], [ondragover],
[ondragstart], [ondrop], [ondurationchange], [onemptied], [onended], [onerror], [onfocus], [onformchange],
[onforminput], [onhaschange], [oninput], [oninvalid], [onkeydown], [onkeypress], [onkeyup], [onload], [onloadeddata],
[onloadedmetadata], [onloadstart], [onmessage], [onmousedown], [onmousemove], [onmouseout], [onmouseover],
[onmouseup], [onmousewheel], [onoffline], [ononline], [onpagehide], [onpageshow], [onpause], [onplay], [onplaying],
[onpopstate], [onprogress], [onratechange], [onreadystatechange], [onredo], [onresize], [onscroll], [onseeked],
[onseeking], [onselect], [onstalled], [onstorage], [onsubmit], [onsuspend], [ontimeupdate], [onundo], [onunload],
[onvolumechange], [onwaiting]
```
**Example**  
```html
// By using the provided htmlLoader, you can use the ES6 template-literal syntax in on* HTML5 event attributes
<mwc-button onclick="${this.itemClick}" label="${props.text}"></mwc-button>
// If you are not using the loader, use the string name of the function to execute
// that is present on the custom element using the template
<mwc-button onclick="itemClick"></mwc-button>
// you can also use "this."
<mwc-button onclick="this.itemClick"></mwc-button>
// you can also refence properties of a member."
<mwc-button onclick="this.someObj.itemClick"></mwc-button>
```
**Example**  
```html
<!-- list.html: -->
<p id="selected-item-text" style="display:${props.selectedItemText ? 'block' : 'none'};">
  ${props.selectedItemText}
</p>
<mwc-formfield id="input-label" alignEnd label="${this.inputLabel}">
  <input onkeyup="${this.onInputKeyUp}" type="text">
</mwc-formfield>
<div>
  <mwc-button id="add-item" onclick="${this.clickHandler}" disabled="disabled">${this.buttonLabel}</mwc-button>
</div>
<ul>
  ${this.items.map((text) => {
    return `<li><mwc-button onclick="${this.itemClick}" label="${text}"></mwc-button></li>`
  }).join("")}
</ul>
```
**Example**  
```js
// define your custom element.
export default class ListComponent extends HTMLElement {
  constructor(self) {
    super(self);
    self = this;
    // use the shadow dom for best results.
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
      this.shadowRoot.innerHTML = "";
      listTemplate({
          // the html template loader will wire up the event handlers for you if you have defined them in your HTML
          onInputKeyUp: () => console.log("input contents changed:", this),
          itemClick: () =>  console.log("item clicked: ", this),
          clickHandler: () =>  console.log("button clicked: ", this),
          selectedItemText: this.getAttribute('selected-item'),
          inputLabel: buttonLabelBlank,
          buttonLabel: "add item to list."
     }).forEach((node) => this.shadowRoot.appendChild(node));
  }
}
customElements.define('list-component', MainComponent);
```
<a name="getFromObj"></a>

## getFromObj(path, obj, fb) ⇒ <code>\*</code> \| <code>String</code>
Returns the value of an object via the path as a string

**Kind**: global function  
**Returns**: <code>\*</code> \| <code>String</code> - whatever the value from the nested key path is or the default string '${path}'.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> |  |
| obj | <code>Object</code> | Object to find the property in |
| fb | <code>String</code> | Fallback string when not found |

**Example**  
```js
let result = getFromObj('hello.foo', {
 hello: {
   foo: 'bar'
 }
});

result == 'bar';
```
<a name="template"></a>

## template(tmpl, map, fallback) ⇒ <code>\*</code> \| <code>String</code>
Processes a string formatted like an ES6 template against an object

**Kind**: global function  
**Returns**: <code>\*</code> \| <code>String</code> - whatever the value from the nested key path is or the default string '${path}'.  

| Param | Type | Description |
| --- | --- | --- |
| tmpl | <code>String</code> | the string template |
| map | <code>Object</code> | Key/Value pairs to process the string against |
| fallback | <code>String</code> | they string fallback when the value is missing. |

**Example**  
```js
let result = template('I am a string literal formatted ${message.label}.', {
 message: {
   label: 'to look like an ES6 template'
 }
});

result == 'I am a string literal formatted to look like an ES6 template.';
```
<a name="stripES6"></a>

## stripES6(expr, context) ⇒ <code>String</code>
removes the ${} wrapping from an es6 template literal expression.

**Kind**: global function  
**Returns**: <code>String</code> - The cleaned sxpression without the ${}.  

| Param | Type | Description |
| --- | --- | --- |
| expr | <code>String</code> | The es6 expression |
| context | <code>Options</code> \| <code>Object</code> | the context object to find values for tokens. |

<a name="arrayParser"></a>

## arrayParser(val, key, params) ⇒ <code>Boolean</code>
In the event that the search string has multiple values with the same key
it will convert that into an array of those values for the given key.

While there is no defined standard in [RFC 3986 Section 3.4](https://tools.ietf.org/html/rfc3986#section-3.4),
most web frameworks accept and serialize them in the following manner as outlined
in [MSDN](https://docs.microsoft.com/en-us/previous-versions/iis/6.0-sdk/ms524784(v=vs.90))

**Kind**: global function  
**Returns**: <code>Boolean</code> - returns the currently parsed value.  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>Object</code> | the value to parse |
| key | <code>String</code> | the name of the value to parse |
| params | <code>Object</code> | all of the parameters that have been parsed so far. |

**Example**  
```js
window.location.search = '?values=foo&values=bar&values=hello&values=world';
const params = toParams(window.location.search, {});
console.log(params) // {values: ["foo","bar","hello", "world"]}
```
**Example**  
```js
window.location.search = '?values=1&values=2&values=3&values=5&values=7';
const params = toParams(window.location.search, {
    values: parseInt
});
console.log(params) // {values: [1, 2, 3, 5, 7]}
```
**Example**  
```js
window.location.search = '?answer=42';
const params = toParams(window.location.search, {
    answer: parseInt
});
console.log(params) // {answer: 42}
```
<a name="toParams"></a>

## toParams(str, options) ⇒ <code>Object</code>
Converts URL parameters to a Object collection of key/value pairs
Decodes encoded url characters to back to normal strings.

**Kind**: global function  
**Returns**: <code>Object</code> - seach params as an object  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> |  |
| options | <code>Object</code> | custom parser functions based on the key name |

**Example** *(convert query string to object:)*  
```js
import {toParams} from '@ornery/web-components';
let paramsObject = toParams('?foo=bar&hello=world&hello=array&unsafe=I%20am%20an%20unsafe%20string');

console.log(paramsObject) // { foo: 'bar', hello: ['world', 'array'], unsafe: 'I am an unsafe string'}
```
**Example** *(pass an optional parser object)*  
```js
import {toParams} from '@ornery/web-components';
let paramsObject = toParams('?intvals=1&intvals=2&intvals=3', {
    intvals: parseInt
});

console.log(paramsObject) // { intvals: [ 1, 2, 3 ] }
```
**Example** *(without psassing an optional parser object)*  
```js
import {toParams} from '@ornery/web-components';
let paramsObject = toParams('?intvals=1&intvals=2&intvals=3');

console.log(paramsObject) // { intvals: [ "1", "2", "3" ] }
```
<a name="toSearch"></a>

## toSearch(options, base) ⇒ <code>String</code>
Converts an Object of String/Value pairs to a query string for URL parameters prepended with the "base" character.
Encodes unsafe url characters to url safe encodings.

**Kind**: global function  
**Returns**: <code>String</code> - the object represented as a query string.  

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 
| base | <code>String</code> | 

**Example** *(convert object to query string)*  
```js

import {toSearch} from '@ornery/web-components';
let queryString = toSearch({
 foo: 'bar',
 hello: ['world', 'array'],
 unsafe: 'I am an unsafe string'

}, '#');

queryString == '#?foo=bar&hello=world&hello=array&unsafe=I%20am%20an%20unsafe%20string';
```
<a name="prefixKeys"></a>

## prefixKeys(obj, prefix) ⇒ <code>Object</code>
Convenience method that converts the keys of an object to have a prefix.
This is faster than stringification.

**Kind**: global function  
**Returns**: <code>Object</code> - The new object with transformed keys.  

| Param | Type |
| --- | --- |
| obj | <code>Object</code> | 
| prefix | <code>String</code> | 

**Example**  
```js
import {prefixKeys} from '@ornery/web-components';
let newObj = prefixKeys({
 foo: 'bar',
 hello: ['world', 'array'],
 unsafe: 'I am an unsafe string'

}, 'zoo-');

newObj == {
  'zoo-foo': 'bar',
  'zoo-hello': ['world', 'array']',
  'zoo-unsafe': 'I am an unsafe string'
};
```
<a name="toDataAttrs"></a>

## toDataAttrs(obj, stringify) ⇒ <code>Object</code>
Convenience method that wraps prefixKeys with 'data-' for easier
property spreading within other frameworks such as react.
This is preferrable over stringifying objects as parsing json is slow in the browser

**Kind**: global function  
**Returns**: <code>Object</code> - The new object with transformed keys.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> |  |
| stringify | <code>Boolean</code> | wether or not to stringify the values for each key. |

**Example** *(React example)*  
```js
const stringTestData = {
 color: "black and white",
 animal: "panda"
};

const MyComponent = (props) => {
  const dataAttrs = toDataAttrs(stringTestData);
  return (<div>
    <div>
      <i18n-message
        data-key="tokenized.message"
        {...dataAttrs}/>
    </div>
    <div>
      <i18n-message
        data-id="tokenized.message"
        {...dataAttrs}
        data-color="red"/>
    </div>
  </div>);
};

const dataAttrs = toDataAttrs(stringTestData);
```
