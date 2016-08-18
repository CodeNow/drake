'use strict'
const RabbitMQ = require('ponos/lib/rabbitmq')
const log = require('./logger').child({ module: 'publisher' })

module.exports = new RabbitMQ({
  name: process.env.APP_NAME,
  log: log,
  tasks: [
    'datadog.hook.received',
    'github.push'
  ],
  events: [
    'dock.disk.filled',
    'dock.memory.exhausted',
    'dock.unresponsive',
    'stripe.invoice.created',
    'stripe.payment-failed',
    'stripe.payment-succeeded'
  ]
})
