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
const webhookUrl = `http://localhost:${process.env.PORT}/github`

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

  describe('Github Webhook', () => {
    const deliveryId = '1'
    const testPayloadForPullRequest = {
      action: 'opened',
      number: 11,
      pull_request: {},
      repository: {},
      organization: {},
      sender: {}
    }
    const headers = {
      'x-github-event': 'pull_request',
      'x-github-delivery': deliveryId,
      'user-agent': 'GitHub.wow'
    }

    it('should publish job when a pull request is opened', () => {
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayloadForPullRequest,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledTwice(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.opened', {
            deliveryId: deliveryId,
            payload: testPayloadForPullRequest
          })
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.event', {
            deliveryId: deliveryId,
            payload: testPayloadForPullRequest
          })
        })
    })

    it('should publish job if re-triggered', () => {
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayloadForPullRequest,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledTwice(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.opened', {
            deliveryId: deliveryId,
            payload: testPayloadForPullRequest
          })
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.event', {
            deliveryId: deliveryId,
            payload: testPayloadForPullRequest
          })
        })
    })

    it('should publish job when a push is recieved', () => {
      headers['x-github-event'] = 'push'
      const testPayloadPush = {
        action: 'opened',
        number: 11,
        pull_request: {},
        repository: {},
        organization: {},
        sender: {}
      }
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayloadPush,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledOnce(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pushed', {
            deliveryId: deliveryId,
            payload: testPayloadPush
          })
        })
    })

    it('should publish job when a push is recieved', () => {
      headers['x-github-event'] = 'ping'
      const push = request.postAsync({
        url: webhookUrl,
        body: {},
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          assert.equal(data.body, 'pong')
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })

    it('should publish job when a new branch is created', () => {
      headers['x-github-event'] = 'create'
      const push = request.postAsync({
        url: webhookUrl,
        body: {},
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledOnce(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.branch.created', {
            deliveryId: deliveryId,
            payload: testPayloadPush
          })
        })
    })

    it('should publish job when a branch is deleted', () => {
      headers['x-github-event'] = 'delete'
      const push = request.postAsync({
        url: webhookUrl,
        body: {},
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledOnce(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.branch.deleted', {
            deliveryId: deliveryId,
            payload: testPayloadPush
          })
        })
    })

    it('should ignore the event ifs not a event we care about', () => {
      headers['x-github-event'] = 'hello'
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayloadForPullRequest,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 202)
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })

    it('should return a 400 if the payload does not match our schema', () => {
      delete headers['x-github-event']
      const push = request.postAsync({
        url: webhookUrl,
        body: testPayloadForPullRequest,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 400)
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })
  })
})
