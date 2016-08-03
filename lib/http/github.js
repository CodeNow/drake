'use strict'

const logger = require('../logger').child({ module: 'http/github' })
const pick = require('101/pick')
const Promise = require('bluebird')
const rabbitmq = require('../rabbitmq')
const errorHandler = require('./error-handler')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by github.
 * @type {Joi~Schema}
 */
const schema = Joi.object({
  'user-agent': Joi.string().regex(/^GitHub.*$/),
  'x-github-event': Joi.string().required(),
  'x-github-delivery': Joi.string().required()
})

/**
 * Determines if an event is a ping.
 * @param {string} eventName Name of the github event.
 * @return {Boolean} `true` if the event is a ping.
 */
function isPing (eventName) {
  return /^ping$/.test(eventName)
}

/**
 * Determines if the event is a push.
 * @param {string} eventName Name of the github event.
 * @return {Boolean} `true` if the event is a push.
 */
function isPush (eventName) {
  return /^push$/.test(eventName)
}

/**
 * Handles incoming github webhook requests.
 * @param {object} request The Hapi request object.
 * @param {object} reply The Hapi reply method.
 */
module.exports = function githubHandler (request, reply) {
  const log = logger.child({
    route: '/github',
    verb: 'POST',
    deliveryId: request.headers['x-github-delivery']
  })
  return Promise
    .try(() => {
      const headers = pick(request.headers, [
        'user-agent',
        'x-github-event',
        'x-github-delivery'
      ])
      log.info({ headers: headers }, 'Handling GitHub web-hook request')
      return Joi.validateAsync(headers, schema)
        .then(() => {
          return [
            headers['x-github-event'],
            headers['x-github-delivery']
          ]
        })
    })
    .spread((eventType, deliveryId) => {
      if (isPush(eventType)) {
        log.debug({ deliveryId: deliveryId }, 'Enqueuing Push Event Job')
        rabbitmq.publishToQueue('github.push', {
          deliveryId: deliveryId,
          payload: request.payload
        })
        return reply('success').code(201)
      }

      if (isPing(eventType)) {
        log.debug({ payload: request.payload }, 'Responding to Ping Event')
        return reply('pong')
      }

      log.warn('Ignoring event')
      return reply('No handler for given event type').code(202)
    })
    .catch((err) => errorHandler(err, reply))
}
