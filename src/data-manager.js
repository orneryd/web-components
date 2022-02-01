const EventMap = require('./event-map');

/**
   * @class DataStore
   * @description Configuration values can be set and propagated to consuming
   * components via this static class or through
   * the corresponding wc-config element
   */
class DataManager {
  constructor() {
    this._state = new EventMap();
  }

  /**
     * @memberOf DataStore
     * @param {String} key
     * @return {Object} the current value of the requested property name.
     */
  get(key) {
    return key ? this._state.get(key) : this._state.getAll();
  }

  /**
     * @memberOf DataStore
     * @return {Object} the current state object.
     */
  getState() {
    return this._state.getAll();
  }
  /**
     * @memberOf DataStore
     * @param {String|Object} key the name of the value to set.
     * It can also be called with an {} query to set multiple values at once.
     * @param {*} value the value of the property to set it to.
     * @return {{state}|*}
     * @description wraps this.set
     */
  set(key, value) {
    let query = key;
    if (value) {
      // we have a single value
      query = {[key]: value};
    }
    return this._state.replace({...this._state.getAll(), ...query});
  }

  /**
     * @memberOf DataStore
     * @param {Object} newState the new state object.
     * @return {{state}|*}
     * @description wraps this.set
     */
  setState(newState) {
    return this.set(newState);
  }
  /**
     * @memberOf DataStore
     * @param {Function} callback is the function to execute when any property changes.
     * @return {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
  subscribe(callback) {
    return callback && this._state.on('set', callback);
  }

  /**
     * @memberOf DataStore
     * @param {Array} keys the property names to be notified when they mutate
     * @param {Function} callback the callback to be executed when any of the value for any of those keys have changed.
     * @return {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
  subscribeTo(keys, callback) {
    keys = typeof (keys) === 'string' ? [keys] : keys;
    return this.subscribe((event, newState, oldState) => {
      let updates;
      keys.forEach((property) => {
        if (newState[property] !== oldState[property]) {
          updates = {
            ...updates,
            [property]: {
              oldValue: oldState[property],
              newValue: newState[property],
            },
          };
        }
      });
      updates && callback(updates, newState, oldState);
    });
  }
}

module.exports = DataManager;
