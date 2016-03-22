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
 * Class for handling GitHub webhook requests.
 * @author Ryan Sandor Richards
 */
class GitHubWebhook {
  /**
   * Handles incoming github webhook requests.
   * @param {object} request The Hapi request object.
   * @param {object} reply The Hapi reply method.
   */
  handler (request, reply) {
    const headers = pick(request.headers, [
      'user-agent',
      'x-github-event',
      'x-github-delivery'
    ])

    const log = logger.child({ headers: headers })
    log.info({ headers: headers }, 'POST /github')

    return Joi.validateAsync(headers, headersSchema)
      .then(() => {
        console.log(this)
        const event = headers['x-github-event']

        if (event.match(/^push$/)) {
          return this.handlePush(request, reply)
        }

        if (event.match(/^ping$/)) {
          return this.handlePing(request, reply)
        }

        return reply('Not found').code(404)
      })
      .catch((err) => {
        log.error({ err: err }, 'Invalid Webhook Request')
        return reply('Bad Request').code(400)
      })
  }

  /**
   * Handles github push event requests.
   * @param {object} request The Hapi request object.
   * @param {object} reply The Hapi reply method.
   * @return {Promise} Resolves when the push event has been handled.
   */
  handlePush (request, reply) {
    return Promise.resolve()
      .then(() => {
        return reply('success')
      })
  }

  /**
   * Handles github ping event requests.
   * @param {object} request The Hapi request object.
   * @param {object} reply The Hapi reply method.
   * @return {Promise} Resolves when the ping event has been handled.
   */
  handlePing (request, reply) {
    return reply('pong')
  }
}

/**
 * Handles incoming github webhook requests.
 * @module drake:http
 */
module.exports = new GitHubWebhook()
