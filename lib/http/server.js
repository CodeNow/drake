'use strict'

require('loadenv')()

const datadogHandler = require('./datadog')
const githubHandler = require('./github')
const Hapi = require('hapi')
const log = require('../logger').child({ module: 'http/server' })
const prometheusHandler = require('./prometheus')
const stripeHandler = require('./stripe')
const versionHandler = require('./version')

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
      handler: githubHandler
    })
    this.instance.route({
      method: 'POST',
      path: '/stripe',
      handler: stripeHandler
    })
    this.instance.route({
      method: 'GET',
      path: '/version',
      handler: versionHandler
    })
    this.instance.route({
      method: 'POST',
      path: '/datadog',
      handler: datadogHandler
    })
    this.instance.route({
      method: 'POST',
      path: '/prometheus',
      handler: prometheusHandler
    })
    this.instance.route({
      method: 'GET',
      path: '/health',
      handler: function (request, reply) {
        reply('You used to call me on my cell phone').code(200)
      }
    })
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
  }

  /**
   * Stops the drake HTTP webhook server.
   * @return {Promise} Resolves when the server has stop.
   */
  stop () {
    return this.instance.stop()
      .then(() => {
        log.info('Drake HTTP Server Stopped')
      })
  }
}

/**
 * The drake HTTP webhook server.
 * @module drake:http
 */
module.exports = new Server()
