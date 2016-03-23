'use strict'

const Promise = require('bluebird')
const TaskFatalError = require('ponos').TaskFatalError

const request = Promise.promisifyAll(require('request'))
const Joi = Promise.promisifyAll(require('joi'))

/**
 * Schema for github.push jobs.
 * @type {Joi~Schema}
 */
const jobSchema = Joi.object({
  deliveryId: Joi.string().required(),
  payload: Joi.object().required()
})

/**
 * Handles github webhook push events.
 * @param {object} job The job to handle.
 * @param {object} job.headers Headers recieved for the github event.
 * @param {object} job.payload The github push event payload.
 * @return {Promise} Resolves when the github push event has been handled.
 */
module.exports = function githubPush (job) {
  return Joi.validateAsync(job, jobSchema)
    .then(() => {
      return request.postAsync(`${process.env.API_URL}/actions/github`, {
        json: true,
        headers: {
          'user-agent': 'GitHub',
          'x-github-event': 'push',
          'x-github-delivery': job.deliveryId
        },
        body: job.payload
      })
    })
    .catch((err) => {
      if (err.isJoi) {
        throw new TaskFatalError('github.push', 'Invalid Job', { err: err })
      }
      throw err
    })
}
