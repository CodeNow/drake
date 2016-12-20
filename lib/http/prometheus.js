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
const requestSchema = Joi.object({
  alerts: Joi.array()
})

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
  log.info({ payload: request.payload }, 'Handling prometheus web-hook request')
  return Joi.validateAsync(request.payload, requestSchema, { stripUnknown: true })
    .then((event) => {
      event.alerts.forEach((alert) => {
        rabbitmq.publishEvent('prometheus.alert.received', alert)
      })
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
        ...
      },
      "annotations": {
        "description": "Dock unresponsive host=10.4.129.107 org=20547680"
      },
      "startsAt": "2016-12-20T00:58:37.811Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://localhost/graph?g0.expr=up+%3D%3D+0&g0.tab=0"
    },
    {
      "status": "resolved",
      "labels": {
        "alertname": "HookDockUnresponsive",
        "githubOrgId": "20547680",
        "hostIp": "10.4.129.2",
        ...
      },
      "annotations": {
        "description": "Dock unresponsive host=10.4.129.2 org=20547680"
      },
      "startsAt": "2016-12-20T00:58:37.811Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://localhost/graph?g0.expr=up+%3D%3D+0&g0.tab=0"
    }
  ],
  "groupLabels": {
    "alertname": "HookDockUnresponsive"
  },
  // note commonLabels only shows keys if ALL firing alerts share values
  // this is blank if 2 servers are alerting at same time
  "commonLabels": {
    "alertname": "HookDockUnresponsive"
  },
  "commonAnnotations": {
  },
  "externalURL": "http://localhost",
  "version": "3",
  "groupKey": 4990955025252445000
}
*/
