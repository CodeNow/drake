'use strict'

const ErrorCat = require('error-cat')
const logger = require('../logger').child({ module: 'http/stripe' })
const Promise = require('bluebird')
const rabbitmq = require('../rabbitmq')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by github.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object({
  payload: Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required()
  }).unknown().required()
}).unknown().required()

/**
 * Handles incoming github webhook requests.
 * @param {object} request The Hapi request object.
 * @param {object} reply The Hapi reply method.
 */
module.exports = function stripeHandler (request, reply) {
  const log = logger.child({
    route: '/stripe',
    verb: 'POST'
  })
  log.info('Handling Stripe web-hook request')
  return Joi.validateAsync(request, requestSchema, { stripUnknown: true })
    .then(function enqueueJob (validatedReq) {
      log.info({ validatedPayload: validatedReq }, 'Handling Stripe web-hook request')
      // Events should be retrieved through the Stripe API (Stripe best practice)
      // Only pass the event ID for worker to retrieve event later
      let stripeEvent = {
        stripeEventId: validatedReq.payload.id
      }
      let eventType = validatedReq.payload.type
      switch (eventType) {
        case 'invoice.created':
          log.trace('`invoice.created` job enqueued')
          rabbitmq.publishEvent('stripe.invoice.created', stripeEvent)
          reply('success').code(200)
          break
        case 'invoice.payment_succeeded':
          log.trace('`invoice.payment-succeeded` job enqueued')
          rabbitmq.publishEvent('stripe.invoice.payment-succeeded', stripeEvent)
          reply('success').code(200)
          break
        case 'invoice.payment_failed':
          log.trace('`invoice.payment-failed` job enqueued')
          rabbitmq.publishEvent('stripe.invoice.payment-failed', stripeEvent)
          reply('success').code(200)
          break
        default:
          log.trace({ eventType: eventType }, 'No stripe event found. Ignoring event.')
          reply('This is an unhandled event').code(204)
      }
    })
    .catch((err) => {
      if (err.isJoi) {
        log.error({ err: err }, 'Invalid Webhook Request')
        return reply('Invalid Webhook Request').code(400)
      }
      log.error({ err: err }, 'Unexpected Error')
      ErrorCat.report(err)
      return reply('Internal Server Error').code(500)
    })
}
