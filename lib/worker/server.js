'use strict'

const log = require('../logger').child({ module: 'worker/server' })
const ponos = require('ponos')

/**
 * The drake ponos server.
 * @type {ponos~Server}
 * @module drake/worker
 */
module.exports = new ponos.Server({
  tasks: {
    'github.push': require('./github.push')
  },
  log: log
})
