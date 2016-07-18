'use strict'

require('loadenv')()

const log = require('../logger').child({ module: 'worker-server' })
const ponos = require('ponos')

/**
 * The drake ponos server.
 * @type {ponos~Server}
 * @module drake/worker-server
 */
module.exports = new ponos.Server({
  name: process.env.APP_NAME,
  rabbitmq: {
    channel: {
      prefetch: process.env.WORKER_PREFETCH
    },
    hostname: process.env.RABBITMQ_HOSTNAME,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD
  },
  log: log,
  tasks: {
    'github.push': require('./github.push')
  }
})
