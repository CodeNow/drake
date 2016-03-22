'use strict'

require('loadenv')()

const hermes = require('../hermes')
const log = require('../logger').child({ module: 'http' })
const server = require('./server')

hermes.connectAsync()
  .then(server.start.bind(server))
  .catch((err) => {
    // TODO Add error-cat
    log.fatal({ err: err }, 'Drake HTTP Server Failed to Start')
    process.exit(1)
  })
