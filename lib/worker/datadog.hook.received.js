'use strict'
const Joi = require('joi')
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const logger = require('../logger').child({ module: 'worker/github.push' })
const rabbitmq = require('../rabbitmq')

module.exports.jobSchema = Joi.object({
  event_msg: Joi.string().regex(/\[RUNNABLE_DATA\].*type=.*\[RUNNABLE_DATA\]/).required()
}).unknown().required()

/**
 * Handles github webhook push events.
 * @param {object} job The job to handle.
 * @param {object} job.event_msg    contains data used to process the job. example:
 * "%%%\n[RUNNABLE_DATA]org=5795842,type=disk_full[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n...%%%"
 * @return {Promise} Resolves when the github push event has been handled.
 */
module.exports.task = (job) => {
  const log = logger.child({ module: 'datadogHook' })
  log.info('datadogHook called')
  return Promise.try(function getEventFromJob () {
    const eventKeys = job.event_msg
      .split('[RUNNABLE_DATA]')[1]
      .split(',')

    const eventData = eventKeys
      .reduce((out, item) => {
        const split = item.split('=')
        var key = split[0]
        var value = split[1]
        out[key] = value
        return out
      }, {})

    let eventName
    if (eventData.type === 'disk_full') {
      eventName = 'dock.disk.filled'
    }

    if (!eventName) {
      throw WorkerStopError('event type not handled')
    }

    return [eventName, eventData]
  })
  .spread(function publishEvent (eventName, eventData) {
    rabbitmq.publishEvent(eventName, eventData)
  })
}
