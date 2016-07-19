'use strict'

const RabbitMQ = require('ponos/lib/rabbitmq')

module.exports = new RabbitMQ({ name: process.env.APP_NAME })
