'use strict'
const Promise = require('bluebird')

const errorHandler = require('./error-handler')
const logger = require('../logger').child({ module: 'http/prometheus' })
const rabbitmq = require('../rabbitmq')

const Joi = Promise.promisifyAll(require('joi'))

/**
 * Webhook headers schema. Will pass if the route is validly hit by prometheus.
 * @type {Joi~Schema}
 */
const requestSchema = Joi.object().unknown().required()

/**
 *
 * @param {Object}     request         - Hapi request object
 * @param {Object}     request.payload - Body JSON Object added by Hapi
 * @param {Object}     reply           - Hapi reply method
 * @returns {Promise}
 * @resolves {void}
 */
module.exports = function prometheusHandler (request, reply) {
  const log = logger.child({
    route: '/prometheus',
    verb: 'POST'
  })
  log.info({ payload: request.payload }, 'Handling Datadog web-hook request')
  return Joi.validateAsync(request, requestSchema, { stripUnknown: true })
    .then((event) => {
      rabbitmq.publishEvent('prometheus.hook.received', event.payload)
      reply('success').code(200)
    })
    .catch((err) => errorHandler(err, reply))
}

/* example hook
{
  "receiver": "drake",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HookDockUnresponsive",
        "githubOrgId": "20547680",
        "hostIp": "10.4.129.107",
        "instance": "10.4.129.107:29006",
        "job": "server_info",
        "reportTo": "drake",
        "type": "unresponsive"
      },
      "annotations": {
        "description": "Dock unresponsive host=10.4.129.107 org=20547680",
        "summary": "Dock unresponsive host=10.4.129.107 org=20547680"
      },
      "startsAt": "2016-12-20T00:58:37.811Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://localhost/graph?g0.expr=up+%3D%3D+0&g0.tab=0"
    }
  ],
  "groupLabels": {
    "alertname": "HookDockUnresponsive"
  },
  "commonLabels": {
    "alertname": "HookDockUnresponsive",
    "githubOrgId": "20547680",
    "hostIp": "10.4.129.107",
    "instance": "10.4.129.107:29006",
    "job": "server_info",
    "reportTo": "drake",
    "type": "unresponsive"
  },
  "commonAnnotations": {
    "description": "Dock unresponsive host=10.4.129.107 org=20547680",
    "summary": "Dock unresponsive host=10.4.129.107 org=20547680"
  },
  "externalURL": "http://localhost",
  "version": "3",
  "groupKey": 4990955025252445000
}
*/
