const {template} = require('./utils');
/**
 * @param {HTMLElement} root The root element to find all elements from.
 * @param {Object} context the context object for finding functions to bind against. default is the root element
 * @return {HTMLElement} the root element passed in.
 * @description helper function used by the loader when importing html files as a template fucntion
 * for using attributes such as "onclick" within your html templates.
 * You do not need to call this yourself if you are importing your html files using the loader
 *
 * @example
 * The event handler method signature is the exact same as standard HTML5 event handlers.
 * [standard HTML5 event handlers]{@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener}.
 *
 * Supported html5 events:
 * [onabort], [onafterprint], [onbeforeonload], [onbeforeprint], [onblur], [oncanplay], [oncanplaythrough], [onchange],
 * [onclick], [oncontextmenu], [ondblclick], [ondrag], [ondragend], [ondragenter], [ondragleave], [ondragover],
 * [ondragstart], [ondrop], [ondurationchange], [onemptied], [onended], [onerror], [onfocus], [onformchange],
 * [onforminput], [onhaschange], [oninput], [oninvalid], [onkeydown], [onkeypress], [onkeyup], [onload], [onloadeddata],
 * [onloadedmetadata], [onloadstart], [onmessage], [onmousedown], [onmousemove], [onmouseout], [onmouseover],
 * [onmouseup], [onmousewheel], [onoffline], [ononline], [onpagehide], [onpageshow], [onpause], [onplay], [onplaying],
 * [onpopstate], [onprogress], [onratechange], [onreadystatechange], [onredo], [onresize], [onscroll], [onseeked],
 * [onseeking], [onselect], [onstalled], [onstorage], [onsubmit], [onsuspend], [ontimeupdate], [onundo], [onunload],
 * [onvolumechange], [onwaiting]
 * @example @lang html
 * // By using the provided htmlLoader, you can use the ES6 template-literal syntax in on* HTML5 event attributes
 * <mwc-button onclick="${this.itemClick}" label="${props.text}"></mwc-button>
 * // If you are not using the loader, use the string name of the function to execute
 * // that is present on the custom element using the template
 * <mwc-button onclick="itemClick"></mwc-button>
 * // you can also use "this."
 * <mwc-button onclick="this.itemClick"></mwc-button>
 * // you can also refence properties of a member."
 * <mwc-button onclick="this.someObj.itemClick"></mwc-button>
 *
 * @example @lang html
 * <!-- list.html: -->
 * <p id="selected-item-text" style="display:${props.selectedItemText ? 'block' : 'none'};">
 *   ${props.selectedItemText}
 * </p>
 * <mwc-formfield id="input-label" alignEnd label="${this.inputLabel}">
 *   <input onkeyup="${this.onInputKeyUp}" type="text">
 * </mwc-formfield>
 * <div>
 *   <mwc-button id="add-item" onclick="${this.clickHandler}" disabled="disabled">${this.buttonLabel}</mwc-button>
 * </div>
 * <ul>
 *   ${this.items.map((text) => {
 *     return `<li><mwc-button onclick="${this.itemClick}" label="${text}"></mwc-button></li>`
 *   }).join("")}
 * </ul>
 *
 * @example @lang js
 * // define your custom element.
 * export default class ListComponent extends HTMLElement {
 *   constructor(self) {
 *     super(self);
 *     self = this;
 *     // use the shadow dom for best results.
 *     this.attachShadow({ mode: 'open' });
 *   }
 *
 *   connectedCallback() {
 *       this.shadowRoot.innerHTML = "";
 *       listTemplate({
 *           // the html template loader will wire up the event handlers for you if you have defined them in your HTML
 *           onInputKeyUp: () => console.log("input contents changed:", this),
 *           itemClick: () =>  console.log("item clicked: ", this),
 *           clickHandler: () =>  console.log("button clicked: ", this),
 *           selectedItemText: this.getAttribute('selected-item'),
 *           inputLabel: buttonLabelBlank,
 *           buttonLabel: "add item to list."
 *      }).forEach((node) => this.shadowRoot.appendChild(node));
 *   }
 * }
 * customElements.define('list-component', MainComponent);
 */
const bindEvents = (root, context = root) => {
  if (!root) return;
  const domElements = Array.from(root.querySelectorAll('*'));
  domElements.forEach((el) => {
    Array.from(el.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on')) {
        let fnOrName = template(attribute.value, context);
        if (typeof context[fnOrName] === 'function') {
          fnOrName = context[fnOrName];
        }
        if (typeof fnOrName === 'function') {
          el.addEventListener(attribute.name.replace('on', ''), function(...args) {
            fnOrName.apply(context, args);
          });
        }
        el.removeAttribute(attribute.name);
      }
    });
  });
  return root;
};

module.exports = bindEvents;
