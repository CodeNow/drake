'use strict'
const Joi = require('joi')
const Promise = require('bluebird')

const logger = require('../logger').child({ module: 'worker/github.push' })
const rabbitmq = require('../rabbitmq')

module.exports.jobSchema = Joi.object({
  id: Joi.string().required(),
  event_title: Joi.string().required(),
  event_msg: Joi.string().required(),
  event_type: Joi.string().required(),
  tags: Joi.string(),
  date: Joi.string().required(),
  alert_id: Joi.string().required(),
  alert_metric: Joi.string().required(),
  alert_transition: Joi.string().required(),
  alert_status: Joi.string().required(),
  secret: process.env.DATADOG_SECRET
}).required()

/**
 * Handles github webhook push events.
 * @param {object} job The job to handle.
 * @param {object} job.headers Headers recieved for the github event.
 * @param {object} job.payload The github push event payload.
 * @return {Promise} Resolves when the github push event has been handled.
 */
module.exports.task = (job) => {
  const log = logger.child({ module: 'datadogHook' })
  log.info('datadogHook called')
  return Promise.try(function getEventNameFromJob () {
    return 'name'
  })
  .then(function publishEvent (eventName) {
    rabbitmq.publishEvent(eventName, job)
  })
}
