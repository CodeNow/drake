'use strict'
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const logger = require('../logger').child({ module: 'worker/github.push' })
const rabbitmq = require('../rabbitmq')
const schemas = require('../schemas')

module.exports.jobSchema = schemas.datadogHookProcess

/**
 * Converts datadog events into specific runnable events
 * @param {object} job The job to handle.
 * @param {object} job.event_msg    contains data used to process the job.
 * @return {Promise} Resolves after publishing next event
 */
module.exports.task = (job) => {
  const log = logger.child({ module: 'datadogHook' })
  return Promise.try(function getEventDataFromJob () {
    // this is formated like
    // "%%%\n[RUNNABLE_DATA]org=5795842,type=disk_full[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n...%%%"
    // extract csv from between RUNNABLE_DATA
    const eventKeys = job.event_msg
      .split('[RUNNABLE_DATA]')[1]
      .split(',')

    return eventKeys.reduce((out, item) => {
      const split = item.split('=')
      const key = split[0]
      const value = split[1]
      out[key] = value
      return out
    }, {})
  })
  .then(function createJobNameFromEvent (eventData) {
    log.trace({ eventData: eventData }, 'createJobNameFromEvent')

    if (eventData.type === 'disk_filled') {
      return ['dock.disk.filled', eventData]
    } else if (eventData.type === 'memory_exhausted') {
      return ['dock.memory.exhausted', eventData]
    } else if (eventData.type === 'unresponsive') {
      return ['dock.unresponsive', eventData]
    }

    throw new WorkerStopError('event type not handled', {
      eventData
    })
  })
  .spread(function publishEvent (eventName, eventData) {
    return rabbitmq.publishEvent(eventName, eventData)
  })
}
