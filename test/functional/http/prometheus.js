'use strict'
require('loadenv')({ debugName: 'drake:test' })
const chai = require('chai')
const Promise = require('bluebird')
const sinon = require('sinon')

const httpServer = require('../../../lib/http/server')
const rabbitmq = require('../../../lib/rabbitmq')
const testEvents = require('../../fixtures/prometheus-events.js')

chai.use(require('chai-as-promised'))
const assert = chai.assert
const request = Promise.promisifyAll(require('request'))
const webhookUrl = `http://localhost:${process.env.PORT}/prometheus`

describe('Functional', () => {
  before('Start HTTP Server', () => {
    return httpServer.start()
  })

  beforeEach('Stub out RabbitMQ', () => {
    sinon.stub(rabbitmq, 'publishEvent')
  })

  after('Stop HTTP and Worker Server', () => {
    return httpServer.stop()
  })

  afterEach('Restore RabbitMQ', () => {
    rabbitmq.publishEvent.restore()
  })

  describe('prometheus Webhook', () => {
    it('should respond to malformed webhook event with a 400', () => {
      const push = request.postAsync({
        url: webhookUrl,
        body: { bad: 'data' },
        json: true
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 400)
        })
    })

    it('should publish job', () => {
      const push = request.postAsync({
        url: webhookUrl,
        body: testEvents.valid,
        json: true
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          sinon.assert.calledTwice(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'prometheus.alert.received', testEvents.valid.alerts[0])
          sinon.assert.calledWith(rabbitmq.publishEvent, 'prometheus.alert.received', testEvents.valid.alerts[1])
        })
    })
  })
})
