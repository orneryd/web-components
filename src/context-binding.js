
module.exports = (superclass) =>
/**
 * @class ContextBinding
 * @param {class} superclass inheriting class
 * @description helper mixins for parsing data-* attributes as json objects via get/setAttribute.
 *
 * @example @lang js
 * //import the ContextBinding mixin
 * import ContextBinding from 'mck-webcomponents/lib/context-binding';
 *
 * // define your custom element.
 * export default class ListComponent extends HTMLElement {
 *   constructor(self) {
 *     super(self);
 *     self = this;
 *   }
 *
 *   connectedCallback() {
 *       this.shadowRoot.innerHTML = "";
 *       // ContextBinding allows you to access data-* attributes as JSON objects with or without the "data-" prefix.
 *       let items = this.getAttribute('items');
 *       listTemplate({
 *           items,
 *      }).forEach((node) => this.shadowRoot.appendChild(node));
 *   }
 * }
 *
 * // Before registering, apply the mixin to your class.
 * customElements.define('list-component', ContextBinding(MainComponent));
 *
 * @example @lang html
 * <!-- Usage in raw HTML -->
 * <list-component data-items="['apple','orange','banana']" selected-item="apple"></list-component>
 *
 */
  class ContextBinding extends superclass {
    constructor(...args) {
      const self = super(...args);
      return self;
    }
    /**
     * @memberof ContextBinding
     * @param {String} attrKey
     * @return {String} current attribute value.
     * @description If using data-attributes, it will handle the string->JSON conversion for you.
     * You may reference the data-* attributes with or without the data- prefix for convenience.
     */
    getAttribute(attrKey) {
      const dataKey = attrKey.replace('data-', '');
      if (typeof this.dataset[dataKey] === 'string') {
        try {
          return JSON.parse(decodeURIComponent(this.dataset[dataKey]));
        } catch (ex) {
          return this.dataset[dataKey];
        }
      } else {
        return super.getAttribute(attrKey);
      }
    }
    /**
     * @memberof ContextBinding
     * @param {String} attrKey the attribute key to set.
     * @param {String|*} attrVal the value to set the attribute to.
     * @description If using data-attributes, it will handle the JSON->string conversion for you when
     * the value to set is not a string.
     * You may reference the data-* attributes with or without the data- prefix for convenience.
     * Bubbles up the attributeChangedCallback to your class when values are set.
     */
    setAttribute(attrKey, attrVal) {
      if ((attrKey.startsWith('data-') || typeof this.dataset[attrKey] === 'string')
          && typeof attrVal !== 'string') {
        try {
          const dataKey = `data-${attrKey}`;
          const oldVal = this.getAttribute(dataKey);
          const newVal = encodeURIComponent(JSON.stringify(attrVal));
          super.setAttribute(dataKey, newVal);
          super.attributeChangedCallback && super.attributeChangedCallback(dataKey, newVal, oldVal);
        } catch (ex) {
          console.warn(`${attrKey} is not convertible to json`, attrVal, ex);
        }
      } else {
        const oldVal = this.getAttribute(attrKey);
        super.setAttribute(attrKey, attrVal);
        super.attributeChangedCallback && super.attributeChangedCallback(attrKey, attrVal, oldVal);
      }
    }
  };
