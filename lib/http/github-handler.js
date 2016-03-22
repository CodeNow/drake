'use strict'

const log = require('../logger').child({ module: 'http/github-handler' })

/**
 * Handles incoming github webhook requests.
 * @param {object} request The Hapi request object.
 * @param {object} reply The Hapi reply method.
 */
module.exports = function githubHandler (request, reply) {
  log.info('POST /github - Handling webhook')
  reply('Success')
}
