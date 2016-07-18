'use strict'

const bunyan = require('bunyan')
const clone = require('101/clone')
const defaults = require('101/defaults')

/**
 * Serializers for drake logging.
 * @type {Object}
 */
var serializers = {
  job (obj) {
    var result = clone(obj)
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
})
