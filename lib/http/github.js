'use strict'

const logger = require('../logger').child({ module: 'http/github-handler' })
const pick = require('101/pick')
const Promise = require('bluebird')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by github.
 * @type {Joi~Schema}
 */
const schema = Joi.object().keys({
  'user-agent': Joi.string().regex(/^GitHub.*$/),
  'x-github-event': Joi.string().required(),
  'x-github-delivery': Joi.string().required()
})

/**
 * Handles incoming github webhook requests.
 * @param {object} request The Hapi request object.
 * @param {object} reply The Hapi reply method.
 */
function handler (request, reply) {
  const headers = pick(request.headers, [
    'user-agent',
    'x-github-event',
    'x-github-delivery'
  ])

  const log = logger.child({ headers: headers })
  log.info({ headers: headers }, 'POST /github')

  return Joi.validateAsync(headers, schema)
    .then(() => {
      const event = headers['x-github-event']

      if (event.match(/^push$/)) {
        const job = {
          headers: headers,
          body: request.body
        }

        // TODO Push job onto the queue
        log.debug({ job: job }, 'Pushing job into queue')

        // TODO What is the expected response?
        return reply('success')
      }

      if (event.match(/^ping$/)) {
        return reply('pong')
      }

      return reply('Not found').code(404)
    })
    .catch((err) => {
      log.error({ err: err }, 'Invalid Webhook Request')
      return reply('Bad Request').code(400)
    })
}

/**
 * Handles incoming github webhook requests.
 * @module drake:http
 */
module.exports = {
  handler: handler,
  schema: schema
}
