'use strict'

const logger = require('../logger').child({ module: 'http/version' })
const version = require('../../package.json').version

module.exports = function versionHandler (request, reply) {
  const log = logger.child({
    route: '/version',
    verb: 'GET'
  })
  log.info('Version requested')
  reply({ name: 'drake', version: version })
}
