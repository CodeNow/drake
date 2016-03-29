'use strict'

const Promise = require('bluebird')
const TaskFatalError = require('ponos').TaskFatalError
const TaskError = require('ponos').TaskError

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
 * Detemines if the given body response from the API is associated with a client
 * error that indicates the push request is associated with a user that is not
 * registered in runnable.
 * @param {string} body Body string of the response to test.
 * @return {boolean} `true` if the error occurred because the user is not registered in
 *   runnable. `false` otherwise.
 */
function isUserOrgError (body) {
  const expr = /not registered in runnable|not a runnable user/i
  return expr.test(body)
}

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
      return request
        .postAsync(`${process.env.API_URL}/actions/github`, {
          json: true,
          headers: {
            'user-agent': 'GitHub',
            'x-github-event': 'push',
            'x-github-delivery': job.deliveryId,
            'x-runnable-drake': 'true'
          },
          body: job.payload
        })
        .then((data) => {
          if (data.statusCode >= 500) {
            throw new TaskError(
              'github.push',
              'API returned server error',
              { statusCode: data.statusCode, body: data.body }
            )
          } else if (data.statusCode >= 300) {
            // Runnable user errors are expected, ignore and acknowledge
            if (isUserOrgError(data.body)) {
              return
            }
            throw new TaskFatalError(
              'github.push',
              'API returned unexpected client error or redirect',
              { statusCode: data.statusCode, body: data.body }
            )
          }
        })
    })
    .catch((err) => {
      if (err.isJoi) {
        throw new TaskFatalError(
          'github.push',
          `Invalid Job: ${err.toString()}`,
          { err: err }
        )
      }
      throw err
    })
}
