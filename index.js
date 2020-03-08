const ContextBinding = require('./src/context-binding');
const DataManager = require('./src/data-manager');
const EventMap = require('./src/event-map');
const i18n = require('./src/i18n');
const utils = require('./src/utils');
const bindEvents = require('./src/bind-events');
const setupConnect = require('./src/setup-connect');

module.exports = {
  ContextBinding,
  DataManager,
  EventMap,
  bindEvents,
  setupConnect,
  ...i18n,
  ...utils,
};
