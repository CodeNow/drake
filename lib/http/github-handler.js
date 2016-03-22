'use strict'

const logger = require('../logger').child({ module: 'http/github-handler' })
const pick = require('101/pick')
const Promise = require('bluebird')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by github.
 * @type {Joi~Schema}
 */
const headersSchema = Joi.object().keys({
  'user-agent': Joi.string().regex(/^GitHub.*$/),
  'x-github-event': Joi.string().required(),
  'x-github-delivery': Joi.string().required()
})

/**
 * Handles incoming github webhook requests.
 * @param {object} request The Hapi request object.
 * @param {object} reply The Hapi reply method.
 */
module.exports = function githubHandler (request, reply) {
  const headers = pick(request.headers, [
    'user-agent',
    'x-github-event',
    'x-github-delivery'
  ])

  const log = logger.child({ headers: headers })
  log.info({ headers: headers }, 'POST /github')

  return Joi.validateAsync(headers, headersSchema)
    .then(() => {
      const event = headers['x-github-event']

      if (event.match(/^ping$/)) {
        return reply('pong')
      }

      if (event.match(/^push$/)) {
        return reply('success')
      }

      return reply('Not found').code(404)
    })
    .catch((err) => {
      log.error({ err: err }, 'Invalid Webhook Request')
      return reply('Not found').code(404)
    })
}
