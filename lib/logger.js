'use strict'

const bunyan = require('bunyan')

/**
 * The default logger for drake.
 * @type {bunyan}
 */
module.exports = bunyan.createLogger({
  name: 'drake',
  streams: [{ level: process.env.LOG_LEVEL, stream: process.stdout }],
  serializers: bunyan.stdSerializers
})
