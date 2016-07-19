'use strict'

const bunyan = require('bunyan')
const clone = require('101/clone')
const defaults = require('101/defaults')
const getNamespace = require('continuation-local-storage').getNamespace

/**
 * Serializers for drake logging.
 * @type {Object}
 */
const serializers = {
  tx () {
    var out
    try {
      out = {
        tid: getNamespace('ponos').get('tid')
      }
    } catch (e) {
      // cant do anything here
    }
    return out
  },

  job (obj) {
    const result = clone(obj)
    if (result.payload) {
      delete result.payload.commits
    }
    return result
  }
}
defaults(serializers, bunyan.stdSerializers)

/**
 * The default logger for drake.
 * @type {bunyan}
 */
module.exports = bunyan.createLogger({
  name: process.env.APP_NAME,
  streams: [{ level: process.env.LOG_LEVEL, stream: process.stdout }],
  serializers: serializers
}).child({ tx: true })
