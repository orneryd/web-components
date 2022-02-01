const DataManager = require('./data-manager');
const {template, getFromObj, toLowerMap} = require('./utils');

if (typeof HTMLElement === 'undefined') {
  // eslint-disable-next-line no-global-assign
  HTMLElement = class {};
}

/**
 *
 * @class I18n
 * @description Import strings here and call I18n.addStrings() with the supported locale identifier
 * and the strings object exported from the locale file
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
class I18n {
  constructor(options) {
    const {
      store = new DataManager(),
      messages = null,
      locale = null,
      fallbackLocale = {
        'default': 'en',
        'de-ch': ['fr', 'it'],
        'zh-hant': ['zh-hans'],
        'es-cl': ['es-ar'],
        'es': ['en'],
        'pt': ['es-ar'],
      },
    } = options;
    this.store = store;
    this.setFallbackLocale(fallbackLocale);
    if (locale) this.setLocale(locale);
    if (messages) this.setMessages(messages);
  }

  setFallbackLocale(fallbackLocales) {
    this._fallbackLocale = toLowerMap(fallbackLocales);
  }
  /**
   * @memberof I18n
   * @return {String} locale
   * @description returns the current locale. defaults to the browser's navigator.locale value.
   * @example
   *
   * navigator.locale = 'en-US';
   * import { I18n } from '@ornery/web-components';
   *
   * console.log(I18n.getLocale()) // "en-US"
   */
  getLocale() {
    return this.store.get('i18n-locale') || '';
  }

  getFallbackLocale() {
    const locale = this.getLocale();
    const defaultLocale = this._fallbackLocale.default;
    const fallbackMap = this._fallbackLocale[locale];
    let fallbackLocale;
    if (fallbackMap) {
      const allMessages = this.store.get('i18n-messages') || {};
      for (let i = 0; i < fallbackMap.length; i++) {
        const fbl = fallbackMap[i];
        if (allMessages[fbl]) {
          fallbackLocale = fbl;
          break;
        }
      }
    }
    return fallbackLocale || defaultLocale || 'en';
  }
  /**
   * @memberof I18n
   * @param {String} locale
   * @return {String} locale
   * @description sets the current i18n locale. This does not change the browser locale.
   * @example
   *
   * import { I18n } from '@ornery/web-components';
   *
   * I18n.setLocale('en-US')
   * console.log(I18n.getLocale()) //'en-US'
   */
  setLocale(locale = '') {
    return this.store.set('i18n-locale', locale);
  }
  /**
   * @memberof I18n
   * @param {String} locale
   * @return {String} locale
   * @description returns the current i18n messages set in the DataManager
   */
  getMessages(locale = null) {
    const allMessages = this.store.get('i18n-messages') || {};
    if (locale === 'all') {
      return allMessages;
    } else {
      locale = locale || this.getLocale();
      const fallbackLocale = this.getFallbackLocale();
      return {
        ...allMessages[fallbackLocale] || {},
        ...allMessages[locale] || {},
      };
    }
  }
  /**
   * @memberof I18n
   * @param {Object} values
   * @return {{state}|*}
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
    const response = this.store.set('i18n-messages', values);
    return response;
  }
  /**
   * @memberof I18n
   * @param {{String}|{Object}} locale
   * @param {Object} newStrings
   * @description add more strings to the existing locale set.
   *
   * @example
   *
   * import { I18n } from '@ornery/web-components';
   * I18n.addMessages('en-US', {
   *  'translatable.message.name': "I'm a translated string from i18n",
   *   'tokenized.message': "I have a ${color} ${animal}"
   * });
   */
  addMessages(locale, newStrings) {
    if (typeof locale !== 'string') {
      newStrings = locale;
      locale = this.getLocale();
    }
    locale = locale.toLowerCase();
    const fallbackLocale = this.getFallbackLocale();
    const existing = this.getMessages('all');
    existing[locale] = {
      ...(existing[locale] || {}),
      ...newStrings,
    };
    if (fallbackLocale !== locale) {
      existing[fallbackLocale] = {
        ...(existing[fallbackLocale] || {}),
        ...newStrings,
      };
    }
    this.setMessages(existing);
  }

  /**
   * @memberof I18n
   * @param {String} key they key of the string to retrieve from the current locale set.
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
      ...this.getMessages(),
      ...data,
    };
    return template(getFromObj(key, context), context);
  }

  /**
   * @memberof I18n
   * @param {String} namespace
   * @param {String} context
   * @return {Object} Returns all the messages for the given locale. Filtered to namespace if provided.
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
  getAll(namespace, context) {
    if (namespace) {
      return Object.keys(this.getMessages()).reduce((reducer, key) => {
        if (key.startsWith(namespace)) {
          reducer[key.replace(namespace + '.', '')] = this.get(key, context);
        }
        return reducer;
      }, {});
    } else {
      return this.getMessages('all');
    }
  }

  subscribe(callback) {
    return this.store.subscribe(callback);
  }
}

module.exports = {
  I18n,
};
