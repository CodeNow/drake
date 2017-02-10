'use strict'
const Promise = require('bluebird')

const errorHandler = require('./error-handler')
const logger = require('../logger').child({ module: 'http/prometheus' })
const rabbitmq = require('../rabbitmq')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by prometheus.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object({
  alerts: Joi.array().required()
}).unknown().required()

/**
 *
 * @param {Object}     request         - Hapi request object
 * @param {Object}     request.payload - Body JSON Object added by Hapi
 * @param {Object}     reply           - Hapi reply method
 * @returns {Promise}
 * @resolves {void}
 */
module.exports = function prometheusHandler (request, reply) {
  const log = logger.child({
    route: '/prometheus',
    verb: 'POST'
  })
  log.info({ payload: request.payload }, 'Handling prometheus web-hook request')
  return Joi.validateAsync(request.payload, requestSchema, { stripUnknown: true })
    .then((event) => {
      event.alerts.forEach((alert) => {
        rabbitmq.publishEvent('prometheus.alert.received', alert)
      })
      reply('success').code(200)
    })
    .catch((err) => errorHandler(err, reply))
}
