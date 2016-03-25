'use strict'

const ErrorCat = require('error-cat')
const hermes = require('runnable-hermes')
const log = require('./logger').child({ module: 'hermes' })
const Promise = require('bluebird')

/**
 * Hermes singelton instance.
 * @type {Hermes}
 */
const client = hermes.hermesSingletonFactory({
  name: 'drake',
  hostname: process.env.RABBITMQ_HOSTNAME,
  port: process.env.RABBITMQ_PORT,
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
  queues: ['github.push']
})

/**
 * Handles errors for the hermes client.
 * @param {Error} The error to handle.
 */
client.on('error', (err) => {
  log.error({ err: err }, 'Hermes client encountered an error')
  ErrorCat.report(err)
})

/**
 * Hermes client for use by drake.
 * @module drake
 */
module.exports = Promise.promisifyAll(client)
