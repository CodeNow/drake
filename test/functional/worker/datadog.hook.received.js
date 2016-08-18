'use strict'
require('loadenv')({ debugName: 'drake:test' })
const chai = require('chai')
const sinon = require('sinon')
const RabbitMQ = require('ponos/lib/rabbitmq')

const rabbitmq = require('../../../lib/rabbitmq')
const WorkerServer = require('../../../lib/worker/server')

chai.use(require('chai-as-promised'))
const testPublisher = new RabbitMQ({
  name: process.env.APP_NAME,
  tasks: [
    'datadog.hook.received'
  ]
})

describe('Datadog worker Functional', () => {
  before('Start worker Server', () => {
    return testPublisher.connect()
      .then(() => { WorkerServer.start() })
  })

  beforeEach('Stub out RabbitMQ', () => {
    sinon.stub(rabbitmq, 'publishEvent')
  })

  afterEach('Restore RabbitMQ', () => {
    rabbitmq.publishEvent.restore()
  })

  after('Stop worker and Worker Server', () => {
    return testPublisher.disconnect()
      .then(() => { WorkerServer.stop() })
  })

  it('should respond to malformed webhook event with a 400', (done) => {
    testPublisher.publishTask('datadog.hook.received', {
      event_msg: '"%[RUNNABLE_DATA]type=disk_filled,test1=val[RUNNABLE_DATA]%"'
    })

    const check = (cb) => {
      if (rabbitmq.publishEvent.callCount !== 1) {
        setTimeout(() => {
          check(cb)
        }, 0)
      } else {
        cb()
      }
    }

    check(() => {
      try {
        sinon.assert.calledOnce(rabbitmq.publishEvent)
        sinon.assert.calledWith(rabbitmq.publishEvent, 'dock.disk.filled', {
          type: 'disk_filled',
          test1: 'val'
        })
      } catch (err) {
        return done(err)
      }
      done()
    })
  })
}) // end 'Datadog worker'
