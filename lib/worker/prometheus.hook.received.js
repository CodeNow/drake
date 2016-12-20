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
  const log = logger.child({ job, module: 'datadogHook' })
  log.info('called')

  return Promise.try(() => {
    const eventData = {
      githubOrgId: job.commonLabels.githubOrgId,
      type: job.alerts[0].labels.type
    }

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
