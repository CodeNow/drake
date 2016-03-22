'use strict'

const hermes = require('../hermes')
const log = require('../logger').child({ module: 'worker/server' })
const ponos = require('ponos')

/**
 * The drake ponos server.
 * @type {ponos~Server}
 * @module drake/worker
 */
const server = module.exports = new ponos.Server({
  hermes: hermes,
  log: log
})
server.setTask('github.push', require('./github-push'))
