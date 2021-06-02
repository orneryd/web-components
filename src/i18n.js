const DataManager = require("./data-manager");
const { template, getFromObj, shouldEncode, encodeHTML } = require("./utils");
const withContext = require("./context-binding");

if (typeof HTMLElement === "undefined") {
    HTMLElement = class {};
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
        // language without region code;
        this._altLangRegex = /[_-]/i;
        this.setDefaultLang();
        this.setLang();
        if (typeof window !== "undefined") {
            if (typeof navigator !== "undefined") {
                this.setLang(navigator.language);
            }
            this.setMessages(window.i18n || {});
        } else {
            if (typeof process !== "undefined") {
                const { env } = process;
                this.setLang(
                    env.LANG ||
                    env.LANGUAGE ||
                    env.LC_ALL ||
                    env.LC_MESSAGES ||
                    this._defaultLang
                );
            }
        }
    }

    setDefaultLang(lang = "en") {
        this._defaultLang = lang.toLowerCase();
        this._fallbackMessages = this.getMessages(this._defaultLang);
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
        return DataManager.get("i18n-language") || '';
    }
    getRootLang() {
        return this.getLang().split(this._altLangRegex)[0];
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
    setLang(lang= "") {
        return DataManager.set("i18n-language", lang)
    }
    /**
     * @memberof I18n
     * @return {String} lang
     * @description returns the current i18n messages set in the DataManager
     */
    getMessages(lang) {
        const allMessages = DataManager.get("i18n-messages") || {};
        if (lang === "all") {
            return allMessages;
        } else {
            lang = lang || this.getLang();
            const rootLang = lang
                ? lang.split(this._altLangRegex)[0]
                : this.getRootLang();
            return {
                ...allMessages[rootLang],
                ...allMessages[lang],
            };
        }
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
        return DataManager.set("i18n-messages", values);
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
    addMessages(lang, newStrings) {
        if (typeof lang !== "string") {
            newStrings = lang;
            lang = this.getLang();
        }
        lang = lang.toLowerCase();
        const rootLang = lang.split(this._altLangRegex)[0];
        const existing = this.getMessages("all");
        existing[rootLang] = {
            ...(existing[rootLang] || {}),
            ...newStrings,
        };
        existing[lang] = {
            ...(existing[lang] || {}),
            ...newStrings,
        };
        this.setMessages(existing);
        if (lang === this._defaultLang) {
            this._fallbackMessages = this.getMessages(lang);
        } else if (rootLang === this._defaultLang) {
            this._fallbackMessages = this.getMessages(rootLang);
        }
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
    get(key, data = {}) {
        const context = {
            ...this._fallbackMessages,
            ...this.getMessages(),
            ...data,
        };
        return template(getFromObj(key, context), context);
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
     * console.log(I18n.getAll('tokenized', {color: "red", animal: "panda"})) // {"message": "I have a red panda"}
     */
    getAll(namespace, data) {
        if (namespace) {
            return Object.keys(this.getMessages()).reduce((reducer, key) => {
                if (key.startsWith(namespace)) {
                    reducer[key.replace(namespace + ".", "")] = this.get(key, data);
                }
                return reducer;
            }, {});
        } else {
            return this.getMessages("all");
        }
    }
})();

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
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ["key", "id", "data-values"];
    }

    get useShadow() {
        if (this.hasAttribute("shadow")) {
            let current = this.getAttribute("shadow");
            if (current === "false") {
                return false;
            }
        }
        return true;
    }

    get translate() {
        return this.getAttribute("key") || this.getAttribute("id");
    }

    attributeChangedCallback(name) {
        this.update();
    }
    
    update() {
        const root = this.shadowRoot || this;
        const context = { ...this.getAttribute("data-values"), ...this.dataset };
        let newMesage = I18n.get(this.translate, context);
        if (shouldEncode(newMesage)) {
            newMesage = encodeHTML(newMesage);
        }
        if (!root.innerHTML) {
            root.innerHTML = newMesage;
        } else if (newMesage !== this.translate || newMesage !== root.innerHTML) {
            root.innerHTML = newMesage;
        }  
    }

    connectedCallback() {
        if (this.useShadow && !this.shadowRoot) this.attachShadow({ mode: "open" });
        this._i18nListener = DataManager.subscribe((newVals) => {
            this.update();
        });
        const attrObserver = new MutationObserver(() => this.update());
        attrObserver.observe(this, { attributes: true, childList: this.useShadow });
    }

    disconnectedCallback() {
        if (this._i18nListener) {
            this._i18nListener.destroy();
            this._i18nListener = null;
        }
    }
}

if (typeof window !== "undefined" && typeof customElements !== "undefined" && !customElements.get("i18n-message")) {
    customElements.define("i18n-message", withContext(I18nMessage));
}

module.exports = {
    I18n,
    I18nMessage,
};
