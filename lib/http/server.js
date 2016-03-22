'use strict'

require('loadenv')()

const Hapi = require('hapi')
const github = require('./github')
const log = require('../logger').child({ module: 'http/server' })

/**
 * Module level wrapper for the drake webhook HTTP server.
 * @author Ryan Sandor Richards
 */
class Server {
  /**
   * Creates a new drake HTTP server for handling incoming webhook requests.
   */
  constructor () {
    this.instance = new Hapi.Server()
    this.instance.connection({ port: process.env.PORT })
    this.instance.route({
      method: 'POST',
      path: '/github',
      handler: github.handler.bind(github)
    })
  }

  /**
   * @return {Hapi~Server} The hapi server underlying this implementation.
   */
  getInstance () {
    return this.instance
  }

  /**
   * Starts the drake HTTP webhook server.
   * @return {Promise} Resolves when the server has started.
   */
  start () {
    return this.instance.start()
      .then(() => {
        log.info({ port: process.env.PORT }, 'Drake HTTP Server Started')
      })
      .catch((err) => {
        // TODO Add error-cat
        log.fatal({ err: err }, 'Drake HTTP Server Failed to Start')
        process.exit(1)
      })
  }
}

/**
 * The drake HTTP webhook server.
 * @module drake:http
 */
module.exports = new Server()
