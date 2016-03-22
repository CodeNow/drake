'use strict'

const hermes = require('runnable-hermes')
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
 * Hermes client for use by drake.
 * @module drake
 */
module.exports = Promise.promisifyAll(client)
