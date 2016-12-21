'use strict'
require('loadenv')({ debugName: 'drake:test' })
const chai = require('chai')
const Promise = require('bluebird')
const RabbitMQ = require('ponos/lib/rabbitmq')
const sinon = require('sinon')

const rabbitmq = require('../../../lib/rabbitmq')
const WorkerServer = require('../../../lib/worker/server')

chai.use(require('chai-as-promised'))
const testPublisher = new RabbitMQ({
  name: process.env.APP_NAME,
  events: [
    'prometheus.alert.received'
  ]
})

describe('Datadog worker Functional', () => {
  before('Start worker Server', () => {
    return testPublisher.connect()
      .then(() => {
        WorkerServer.start()
      })
  })

  beforeEach('Stub out RabbitMQ', () => {
    sinon.stub(rabbitmq, 'publishEvent')
  })

  afterEach('Restore RabbitMQ', () => {
    rabbitmq.publishEvent.restore()
  })

  after('Stop worker and Worker Server', () => {
    return testPublisher.disconnect()
      .then(() => {
        WorkerServer.stop()
      })
  })

  it('should fire disk filled event', () => {
    testPublisher.publishEvent('prometheus.alert.received', {
      status: 'firing',
      labels: {
        githubOrgId: '123',
        hostIp: '10.2.2.2',
        type: 'disk_filled'
      }
    })

    return Promise.try(function loop () {
      if (!rabbitmq.publishEvent.calledOnce) {
        return Promise.delay(5).then(loop)
      }
    })
    .then(() => {
      sinon.assert.calledOnce(rabbitmq.publishEvent)
      sinon.assert.calledWith(rabbitmq.publishEvent, 'dock.disk.filled', {
        githubOrgId: '123',
        hostIp: '10.2.2.2',
        type: 'disk_filled',
        host: 'http://10.2.2.2:4242'
      })
    })
  })
}) // end 'Datadog worker'
