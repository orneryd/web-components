const DataManager = require("./data-manager");
const { template } = require("./utils");
const withContext = require("./context-binding");

if (typeof HTMLElement !== "undefined") {
  /**
   * @class I18nMessage
   * @description <i18n-message> HTML element. Provides tranlsation and interpolation for
   * translatable strings
   * @param {String} key the key for the strings based on current language. can be set as the innerHTML or
   * defined as the attibutes: key, id, data-key, data-id
   * @param {JSON} values can be passed as data-* attributes or as a json-parseable object string as "data-values"
   * @param {String} dataAttributes
   * @example <caption>Given the following configuration</caption>
   * import { I18n } from '@ornery/web-components';
   * I18n.addMessages('en-US', {
   *  'translatable.message.name': "I'm a translated string from i18n",
   *   'tokenized.message': "I have a ${color} ${animal}"
   * });
   * @example @lang html <caption>With the following usage</caption>
   * <i18n-message>translatable.message.name</i18n-message>
   * <div>
   *    <i18n-message data-values="{'color: 'grey', 'animal': 'monkey'}">tokenized.message</i18n-message>
   *    <i18n-message data-color="grey" data-animal="monkey">tokenized.message</i18n-message>
   *    <i18n-message key="tokenized.message"/>
   *    <!-- React does not pass key or ref props so you can use "data-key" or "data-id" as well-->
   *    <i18n-message data-key="tokenized.message"/>
   *    <i18n-message id="translatable.message.name"/>
   *    <i18n-message data-id="translatable.message.name"/>
   * </div>
   *
   * @example @lang html <caption>Renders the HTML</caption>
   * <i18n-message>I'm a translated string from i18n</i18n-message>
   * <i18n-message>I have a grey monkey</i18n-message>
   */
  class I18nMessage extends HTMLElement {
    constructor(self) {
      self = super(self);
      this.attachShadow({ mode: "open" });
      return self;
    }

    get translate() {
      return (
        this.innerHTML || this.getAttribute("key") || this.getAttribute("id")
      );
    }

    update() {
      const context = { ...this.getAttribute("data-values"), ...this.dataset };
      this.shadowRoot.innerHTML = I18n.get(this.translate, context);
    }

    connectedCallback() {
      DataManager.subscribeTo("i18n-messages", () => {
        this.update();
      });
      const attrObserver = new MutationObserver(() => this.update());
      attrObserver.observe(this, { attributes: true, childList: true });
    }
  }

  /**
   *
   * @class I18n
   * @description Import strings here and call I18n.addStrings() with the supported locale identifier
   * and the strings object exported from the language file
   * By default, it will set the values on window.i18n, if defined when loaded, as the starting messages.
   * This is useful if you wish to server-side render HTML certain content before laoding scripts on the client.
   * @example
   *
   * import { I18n } from '@ornery/web-components';
   *
   * I18n.addMessages('en-US', {
   *     'translatable.message.name': "I'm a translated string from i18n",
   *     'tokenized.message': "I have a ${this.color} ${this.animal}"
   * });
   *
   * @example
   *
   * window.i18n = {
   *     'en-US': {
   *         'translatable.message.name': "I'm a translated string from i18n",
   *         'tokenized.message': "I have a ${this.color} ${this.animal}"
   *     }
   * }
   *
   * import { I18n } from '@ornery/web-components';
   *
   * console.log(I18n.getMessages()) // will log the window.i18n object
   *
   */
  const I18n = new (class {
    constructor() {
      if (typeof window !== "undefined") {
        this._lang = navigator.language || "en-US"; // language without region code;
        this.setMessages(window.i18n || {});
        customElements.define("i18n-message", withContext(I18nMessage));
      }
    }

    /**
     * @memberof I18n
     * @return {String} lang
     * @description returns the current language. defaults to the browser's navigator.language value.
     * @example
     *
     * navigator.language = 'en-US';
     * import { I18n } from '@ornery/web-components';
     *
     * console.log(I18n.getLang()) // "en-US"
     */
    getLang() {
      return this._lang;
    }
    /**
     * @memberof I18n
     * @param {String} lang
     * @description sets the current i18n language. This does not change the browser language.
     * @example
     *
     * import { I18n } from '@ornery/web-components';
     *
     * I18n.setLang('en-US')
     * console.log(I18n.getLang()) //'en-US'
     */
    setLang(lang) {
      this._lang = lang.toLowerCase();
    }
    /**
     * @memberof I18n
     * @return {String} lang
     * @description returns the current i18n messages set in the DataManager
     */
    getMessages() {
      return DataManager.get("i18n-messages") || {};
    }
    /**
     * @memberof I18n
     * @param {Object} values
     * @description sets the strings as a whole. This overrides all existing strings.
     * Use addMessages to add more strings to the existing set.
     * @example
     *
     * import { I18n } from '@ornery/web-components';
     *
     * I18n.setMessages({
     *     'en-US': {
     *         'translatable.message.name': "I'm a translated string from i18n",
     *         'tokenized.message': "I have a ${this.color} ${this.animal}"
     *     }
     * })
     */
    setMessages(values) {
      DataManager.set("i18n-messages", values) || {};
    }
    /**
     * @memberof I18n
     * @param {String} lang
     * @param {Object} strings
     * @description add more strings to the existing language set.
     *
     * @example
     *
     * import { I18n } from '@ornery/web-components';
     * I18n.addMessages('en-US', {
     *  'translatable.message.name': "I'm a translated string from i18n",
     *   'tokenized.message': "I have a ${color} ${animal}"
     * });
     */
    addMessages(lang, strings) {
      const existing = this.getMessages();
      const newMessages = {
        ...existing,
        [lang]: { ...existing[lang], ...strings },
      };
      this.setMessages(newMessages);
    }

    /**
     * @memberof I18n
     * @param {String} key they key of the string to retrieve from the current language set.
     * @param {Object} data Optional, The data to process tokens in the string with.
     * @return {String} Returns the value for the key. Processed if a data context is provided as the second argument.
     * @description Returns the value for the key. If a context is provided as the second argument for tokens,
     * the tokens will be replaced in the returned string.
     * @example
     *
     * import { I18n } from '@ornery/web-components';
     * I18n.addMessages('en-US', {
     *   'tokenized.message': "I have a ${color} ${animal}"
     * });
     *
     * const stringTestData = {
     *     color: "grey",
     *     animal: "monkey"
     * };
     * console.log(I18n.get('tokenized.message', stringTestData)) // "I have a grey monkey"
     */
    get(key, data) {
      const strings = this.getMessages()[this._lang];
      let string = strings && strings[key];
      if (data) {
        string = template(string, data);
      }
      // type coercion desired in this case for string = undefined possibility
      return string;
    }

    /**
     * @memberof I18n
     * @param {String} namespace
     * @return {Object} Returns all the messages for the given language. Filtered to namespace if provided.
     * @description If a namespace is provided, returns all the key value pairs for that
     * namespace without the namespace in the keys.
     *
     * @example
     *
     * import { I18n } from '@ornery/web-components';
     * I18n.addMessages('en-US', {
     *  'translatable.message.name': "I'm a translated string from i18n",
     *   'tokenized.message': "I have a ${color} ${animal}"
     * });
     *
     * console.log(I18n.getAll('tokenized')) // {"message": "I have a ${color} ${animal}"}
     */
    getAll(namespace) {
      if (namespace) {
        return Object.entries(this.getMessages()[this._lang])
          .filter(([key, value]) => {
            return key.startsWith(namespace) && value;
          })
          .reduce((reducer, [key, val]) => {
            reducer[key.replace(namespace + ".", "")] = val;
            return reducer;
          }, {});
      } else {
        return this.getMessages()[this._lang];
      }
    }
  })();

  module.exports = {
    I18n,
    I18nMessage,
  };
} else {
  module.exports = {
    I18n: {
      get: () => {},
      getAll: () => {},
      addMessages: () => {},
      setMessages: () => {},
      getMessages: () => {},
      getLang: () => {},
      setLang: () => {},
    },
    I18nMessage: class {},
  };
}
