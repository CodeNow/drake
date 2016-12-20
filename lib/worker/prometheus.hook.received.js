'use strict'
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const logger = require('../logger').child({ module: 'worker/github.push' })
const rabbitmq = require('../rabbitmq')
const schemas = require('../schemas')

module.exports.jobSchema = schemas.prometheusHookProcess

/**
 * @param {object} job The job to handle.
 * @param {object} job
 * @param {string} job.githubOrgId
 * @param {string} job.labels.hostIp
 * @param {string} job.labels.status
 * @param {string} job.labels.type
 * @return {Promise} Resolves after publishing next event
 */
module.exports.task = (job) => {
  const log = logger.child({ job, module: 'datadogHook' })
  log.info('called')

  return Promise.try(() => {
    if (job.status !== 'firing') {
      return
    }

    const eventName = module.exports._getEventNameFromType(job.labels.type)
    job.labels.host = `http://${job.labels.hostIp}:4242`

    return rabbitmq.publishEvent(eventName, job.labels)
  })
}

/**
 * @param  {string} type
 * @return {string}
 */
module.exports._getEventNameFromType = (type) => {
  switch (type) {
    case 'disk_filled':
      return 'dock.disk.filled'

    case 'memory_exhausted':
      return 'dock.memory.exhausted'

    case 'unresponsive':
      return 'dock.unresponsive'
  }

  throw new WorkerStopError('event type not handled', { type })
}
