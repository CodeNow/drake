'use strict'

const logger = require('../logger').child({ module: 'http/stripe' })
const Promise = require('bluebird')
// const rabbitmq = require('../rabbitmq')
const errorHandler = require('./error-handler')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by datadog.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object({
  payload: Joi.object({
    id: Joi.string().required(),
    event_title: Joi.string().required(),
    event_msg: Joi.string().required(),
    event_type: Joi.string().required(),
    tags: Joi.string().required(),
    date: Joi.string().required(),
    alert_id: Joi.string().required(),
    alert_metric: Joi.string().required(),
    alert_transition: Joi.string().required(),
    alert_status: Joi.string().required(),
    secret: Joi.string().required()
  }).unknown().required()
}).unknown().required()

/**
 * Handles incoming github webhook requests.
 *
 * @param {Object}     request         - Hapi request object
 * @param {Object}     request.payload - Body JSON Object added by Hapi
 * @param {Object}     reply           - Hapi reply method
 * @returns {Promise}
 * @resolves {void}
 */
module.exports = function datadogHandler (request, reply) {
  const log = logger.child({
    route: '/datadog',
    verb: 'POST'
  })
  log.info({ payload: request.payload }, 'Handling Datadog web-hook request')
  return Joi.validateAsync(request, requestSchema, { stripUnknown: true })
    .then((event) => {
      // rabbitmq.publishEvent(`datadog.${name}`, event)
      reply('success').code(200)
    })
    .catch((err) => errorHandler(err, reply))
}
