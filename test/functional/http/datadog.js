'use strict'
require('loadenv')({ debugName: 'drake:test' })
const chai = require('chai')
const Promise = require('bluebird')
const sinon = require('sinon')

const httpServer = require('../../../lib/http/server')
const rabbitmq = require('../../../lib/rabbitmq')

chai.use(require('chai-as-promised'))
const assert = chai.assert
const request = Promise.promisifyAll(require('request'))
const webhookUrl = `http://localhost:${process.env.PORT}/datadog`
const healthUrl = `http://localhost:${process.env.PORT}/health`

describe('Functional', () => {
  before('Start HTTP Server', () => {
    return httpServer.start()
  })

  beforeEach('Stub out RabbitMQ', () => {
    sinon.stub(rabbitmq, 'publishTask')
  })

  after('Stop HTTP and Worker Server', () => {
    return httpServer.stop()
  })

  afterEach('Restore RabbitMQ', () => {
    rabbitmq.publishTask.restore()
  })

  describe('Health check', () => {
    it('should respond 200', () => {
      const getRequest = request.getAsync({
        url: healthUrl
      })
      return assert.isFulfilled(getRequest)
        .then((data) => {
          assert.equal(data.statusCode, 200)
        })
    })
  })
  describe('Datadog Webhook', () => {
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
      const testPayload = {
        id: '123123',
        event_title: 'world champ',
        event_msg: 'Lots Of Data',
        date: '1738',
        alert_transition: 'Triggered',
        secret: process.env.DATADOG_SECRET
      }
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayload,
        json: true
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          sinon.assert.calledOnce(rabbitmq.publishTask)
          sinon.assert.calledWith(rabbitmq.publishTask, 'datadog.hook.received', testPayload)
        })
    })

    it('should publish job if re-triggered', () => {
      const testPayload = {
        id: '123123',
        event_title: 'world champ',
        event_msg: 'Lots Of Data',
        date: '1738',
        alert_transition: 'Re-Triggered',
        secret: process.env.DATADOG_SECRET
      }
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayload,
        json: true
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          sinon.assert.calledOnce(rabbitmq.publishTask)
          sinon.assert.calledWith(rabbitmq.publishTask, 'datadog.hook.received', testPayload)
        })
    })
  })
})
