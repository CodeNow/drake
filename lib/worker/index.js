'use strict'

const server = require('./server')
const log = require('../logger').child({ module: 'worker' })

server.start()
  .catch((err) => {
    // TODO Add rollbar reporting / monitoring
    log.fatal({ err: err }, 'Worker server failed to start')
    process.exit(1)
  })
