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
 * Determines if the event is a branch creation
 * @param eventName eventName Name of the github event.
 * @returns {boolean} `true` if the event is a create
 */
function isCreateBranch (eventName) {
  return /^create/.test(eventName)
}

/**
 * Determins if the event is a branch deletion
 * @param eventName eventName Name of the github event.
 * @returns {boolean} `true` if the event is a delete
 */
function isDeleteBranch (eventName) {
  return /^delete/.test(eventName)
}

/**
 * Determines if the event is a pull_request
 * @param eventName eventName Name of the github event.
 * @returns {boolean} `true` if the event is a pull_request
 */
function isPullRequest (eventName) {
  return /^pull_request/.test(eventName)
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
    deliveryId: request.headers['x-github-delivery'],
    payload: request.payload
  })
  log.trace('incoming hook')
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
        log.trace('Enqueuing Push Event Job')
        rabbitmq.publishEvent('github.pushed', {
          deliveryId,
          payload: request.payload
        })
        return reply('success').code(201)
      }

      if (isPing(eventType)) {
        log.trace('Responding to Ping Event')
        return reply('pong')
      }

      if (isCreateBranch(eventType)) {
        let eventName = ''
        switch (request.payload.ref_type) {
          case 'repository':
            eventName = 'github.repository.created'
            break
          case 'branch':
            eventName = 'github.branch.created'
            break
          case 'tag':
            eventName = 'github.tag.created'
            break
          default:
            return reply('success').code(201)
        }

        log.debug({ deliveryId }, `Enqueuing create ${request.payload.ref_type} job`)
        rabbitmq.publishEvent(eventName, {
          deliveryId,
          payload: request.payload
        })
        return reply('success').code(201)
      }

      if (isDeleteBranch(eventType)) {
        let eventName = ''
        switch (request.payload.ref_type) {
          case 'branch':
            eventName = 'github.branch.deleted'
            break
          case 'tag':
            eventName = 'github.tag.deleted'
            break
          default:
            return reply('success').code(201)
        }

        log.debug({ deliveryId }, `Enqueuing delete ${request.payload.ref_type} job`)
        rabbitmq.publishEvent(eventName, {
          deliveryId,
          payload: request.payload
        })
        return reply('success').code(201)
      }

      if (isPullRequest(eventType)) {
        let eventName = ''
        switch (request.payload.action) {
          case 'assigned':
          case 'unassigned':
          case 'review_requested':
          case 'review_request_removed':
          case 'labeled':
          case 'unlabeled':
          case 'opened':
          case 'edited':
          case 'closed':
          case 'reopened':
            eventName = `github.pull-request.${request.payload.action.replace(/_/, '-')}`
            break
          case 'synchronize':
            eventName = `github.pull-request.synchronized`
            break
          default:
            return reply('success').code(201)
        }
        log.debug({ deliveryId }, `Enqueuing pull request ${request.payload.ref_type} job`)
        rabbitmq.publishEvent(eventName, {
          deliveryId,
          payload: request.payload
        })
        return reply('success').code(201)
      }

      log.warn('Ignoring event')
      return reply('No handler for given event type').code(202)
    })
    .catch((err) => errorHandler(err, reply))
}
