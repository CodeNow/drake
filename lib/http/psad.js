'use strict'
const Promise = require('bluebird')

const errorHandler = require('./error-handler')
const logger = require('../logger').child({ module: 'http/psad' })
const rabbitmq = require('../rabbitmq')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by psad.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object({
  containerId: Joi.string().required(),
  logs: Joi.string()
}).unknown().required()

/**
 *
 * @param {Object}     request         - Hapi request object
 * @param {Object}     request.payload - Body JSON Object added by Hapi
 * @param {Object}     reply           - Hapi reply method
 * @returns {Promise}
 * @resolves {void}
 */
module.exports = function psadHandler (request, reply) {
  const log = logger.child({
    route: '/psad',
    verb: 'POST'
  })
  log.info({ payload: request.payload }, 'Handling psad web-hook request')
  return Joi.validateAsync(request.payload, requestSchema, { stripUnknown: true })
  .then((event) => {
    rabbitmq.publishEvent('psad.alert.received', event)
    reply('success').code(200)
  })
  .catch((err) => errorHandler(err, reply))
}
