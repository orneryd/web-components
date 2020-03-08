/**
 * @class EventMap
 * @description provides an event bus for when properties of the underlying Map change.
 */
module.exports = class EventMap {
  constructor() {
    this._map = new Map();
    this._subscribers = {
      'clear': [],
      'delete': [],
      'set': [],
    };
    this._cache = {};
  }

  _notify(event, oldState) {
    this._subscribers[event].forEach((sub) => sub(event, this._cache, oldState));
  }

  _updateCache() {
    const params = {};
    this._map.forEach((val, key) => params[key] = val);
    this._cache = params;
  }

  /**
   * @memberOf EventMap
   * @param {String} event 'set'= after the property has been set
   * @param {Function} callback notification channel
   * @return {Object} with the subscriber function, the event name, and a destroy function.
   * @description call the destroy() function ont he returned object to remove the event listener
   */
  on(event, callback) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }
    this._subscribers[event].push(callback);
    const subs = this._subscribers[event];

    callback && callback('set', this._cache, {});
    return {
      subscriber: callback,
      event: event,
      destroy: () => {
        subs.splice(subs.indexOf(callback), 1);
      },
    };
  }

  /**
   * @memberOf EventMap
   * @param {String} key
   * @param {Object|Array} val
   * @param {Boolean} notify set false to NOT notify subscribers.
   * @return {EventMap} this eventmap instance.
   * @description call set() set the value for a given key in the map.
   */
  set(key, val, notify) {
    let proceed;
    if (Array.isArray(val)) {
      // this might need to be a better algorithm, this should work for now.
      proceed = JSON.stringify(val) !== JSON.stringify(this._cache[key]);
    } else {
      proceed = val !== this._cache[key];
    }
    if (proceed) {
      this._map.set(key, val);
      if (notify !== false) {
        this._notify('set', this._cache);
      }
      this._updateCache();
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {Object} keyValuePairs
   * @param {Boolean} notify set false to NOT notify subscribers.
   * @return {EventMap} this eventmap instance.
   * @description call replace() to replace the existing state.
   */
  replace(keyValuePairs, notify) {
    const oldState = Object.assign({}, this._cache);
    Object.keys(oldState)
        .forEach((oldKey) => this.set(oldKey, keyValuePairs[oldKey], false));
    Object.keys(keyValuePairs)
        .forEach((newKey) => this.set(newKey, keyValuePairs[newKey], false));
    if (notify !== false) {
      this._notify('set', oldState);
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {*} key the key to remove from the map.
   * @param {Boolean} notify set false to NOT notify subscribers.
   * @return {EventMap} this eventmap instance.
   * @description call del() to remove a value from the map.
   */
  del(key, notify) {
    if (this._cache[key]) {
      this._map['delete'](key);
      if (notify !== false) {
        this._notify('delete', this._cache);
      }
      this._updateCache();
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {Boolean} notify set false to NOT notify subscribers.
   * @return {Object} object hash of all the key value pairs.
   * @description call clear() to remove all the key/value entries from the map.
   */
  clear(notify) {
    const oldState = this.getAll();
    this._map.clear();
    if (notify !== false) {
      this._notify('clear', oldState);
    }
    return this;
  }


  /**
   * @memberOf EventMap
   * @return {Object} object hash of all the key value pairs.
   * @description call getAll() to retrieve the current set of key/value pairs.
   */
  getAll() {
    return {...this._cache};
  }

  get(key) {
    return this._map.get(key);
  }
  entries() {
    return this._map.entries();
  }
  forEach(callback) {
    return this._map.forEach(callback);
  }
  keys() {
    return this._map.keys();
  }
  values() {
    return this._map.values();
  }
};
