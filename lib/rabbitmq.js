'use strict'
const RabbitMQ = require('ponos/lib/rabbitmq')
const log = require('./logger').child({ module: 'publisher' })

const schemas = require('../schemas')

module.exports = new RabbitMQ({
  name: process.env.APP_NAME,
  log: log,
  tasks: [
    {
      name: 'datadog.hook.received',
      jobSchema: schemas.datadogHookProcess
    },
    {
      name: 'github.push',
      jobSchema: schemas.githubPush
    }
  ],
  events: [
    {
      name: 'dock.disk.filled',
      jobSchema: schemas.dockEvent
    },
    {
      name: 'dock.memory.exhausted',
      jobSchema: schemas.dockEvent
    },
    {
      name: 'dock.unresponsive',
      jobSchema: schemas.dockEvent
    },
    {
      name: 'stripe.invoice.created',
      jobSchema: schemas.stripeEvent
    },
    {
      name: 'stripe.invoice.payment-failed',
      jobSchema: schemas.stripeEvent
    },
    {
      name: 'stripe.invoice.payment-succeeded',
      jobSchema: schemas.stripeEvent
    }
  ]
})
