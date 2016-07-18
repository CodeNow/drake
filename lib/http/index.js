'use strict'

require('loadenv')()

const CriticalError = require('error-cat/errors/critical-error')
const ErrorCat = require('error-cat')
const rabbitmq = require('../rabbitmq')
const log = require('../logger').child({ module: 'http' })
const server = require('./server')

rabbitmq.publisher.connect()
  .then(server.start.bind(server))
  .catch((err) => {
    log.fatal({ err: err }, 'Drake HTTP Server Failed to Start')
    ErrorCat.report(new CriticalError(
      'Drake HTTP Server Failed to Start',
      { err: err }
    ))
    process.exit(1)
  })
