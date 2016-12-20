'use strict'

const log = require('../logger').child({ module: 'worker/server' })
const ponos = require('ponos')

/**
 * The drake ponos server.
 * @type {ponos~Server}
 * @module drake/worker
 */
module.exports = new ponos.Server({
  name: process.env.APP_NAME,
  enableErrorEvents: true,
  rabbitmq: {
    channel: {
      prefetch: process.env.WORKER_PREFETCH
    }
  },
  events: {
    'datadog.hook.received': require('./datadog.hook.received'),
    'prometheus.alert.received': require('./prometheus.alert.received')
  },
  log: log
})
