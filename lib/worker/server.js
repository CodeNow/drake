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
  rabbitmq: {
    channel: {
      prefetch: process.env.WORKER_PREFETCH
    }
  },
  tasks: {
    'datadog.hook.received': require('./datadog.hook.received'),
    'github.push': require('./github.push')
  },
  log: log
})
