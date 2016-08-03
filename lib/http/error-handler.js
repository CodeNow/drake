'use strict'

const ErrorCat = require('error-cat')

const log = require('../logger').child({})

module.exports = function errorHandler (err, reply) {
  if (err.isJoi) {
    log.error({ err: err }, 'Invalid Webhook Request')
    return reply('Invalid Webhook Request').code(400)
  }
  log.error({ err: err }, 'Unexpected Error')
  ErrorCat.report(err)
  return reply('Internal Server Error').code(500)
}
