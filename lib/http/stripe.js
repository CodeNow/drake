'use strict'

const Promise = require('bluebird')
const keypather = require('keypather')()

const logger = require('../logger').child({ module: 'http/stripe' })
const rabbitmq = require('../rabbitmq')
const errorHandler = require('./error-handler')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by github.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object({
  payload: Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    data: Joi.object({
      object: Joi.object({
        customer: Joi.string()
      }).unknown()
    }).unknown()
  }).unknown().required()
}).unknown().required()

/**
 * Respond HTTP request to a found event
 *
 * @param {String}    name        - name of event
 * @param {Object}    stripeEvent - Event to be enqueued
 * @param {Function}  reply       - Respond function supplied by Hapi
 * @returns {void}
 */
const respond = function (name, stripeEvent, reply) {
  const log = logger.child({ method: 'respond', eventName: name, stripeEvent: stripeEvent })
  log.trace(`${name} job enqueued`)
  rabbitmq.publishEvent(`stripe.${name}`, stripeEvent)
  reply('success').code(200)
}

/**
 * Handles incoming github webhook requests.
 *
 * @param {Object}     request         - Hapi request object
 * @param {Object}     request.payload - Body JSON Object added by Hapi
 * @param {Object}     reply           - Hapi reply method
 * @returns {Promise}
 * @resolves {void}
 */
module.exports = function stripeHandler (request, reply) {
  const log = logger.child({
    route: '/stripe',
    verb: 'POST'
  })
  log.info({ payload: request.payload }, 'Handling Stripe web-hook request')
  return Joi.validateAsync(request, requestSchema, { stripUnknown: true })
    .then(function enqueueJob (validatedReq) {
      log.info({ validatedPayload: validatedReq }, 'Handling Stripe web-hook request')
      // Events should be retrieved through the Stripe API (Stripe best practice)
      // Only pass the event ID for worker to retrieve event later
      let stripeEvent = {
        stripeEventId: validatedReq.payload.id,
        stripeCustomerId: keypather.get(validatedReq, 'payload.data.object.customer')
      }
      let eventType = validatedReq.payload.type

      switch (eventType) {
        case 'invoice.created':
          respond('invoice.created', stripeEvent, reply)
          break
        case 'invoice.payment_succeeded':
          respond('invoice.payment-succeeded', stripeEvent, reply)
          break
        case 'invoice.payment_failed':
          respond('invoice.payment-failed', stripeEvent, reply)
          break
        default:
          log.trace({ eventType: eventType }, 'No stripe event found. Ignoring event.')
          reply('This is an unhandled event').code(204)
      }
    })
    .catch((err) => errorHandler(err, reply))
}
