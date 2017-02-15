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
    let testGithubPayload
    const headers = {
      'x-github-event': 'pull_request',
      'x-github-delivery': deliveryId,
      'user-agent': 'GitHub.wow'
    }

    beforeEach('Setup githubPayload', () => {
      testGithubPayload = {
        action: 'opened',
        number: 11,
        pull_request: {},
        repository: {},
        organization: {},
        sender: {}
      }
    })

    ;[
      'assigned',
      'unassigned',
      'review_requested',
      'review_request_removed',
      'labeled',
      'unlabeled',
      'opened',
      'edited',
      'closed',
      'reopened'
    ].forEach((event) => {
      it(`should publish job when a pull request is ${event}`, () => {
        testGithubPayload.action = event
        const push = request.postAsync({
          url: webhookUrl,
          body: testGithubPayload,
          json: true,
          headers: headers
        })
        return assert.isFulfilled(push)
          .then((data) => {
            assert.equal(data.statusCode, 201)
            sinon.assert.calledOnce(rabbitmq.publishEvent)
            sinon.assert.calledWith(rabbitmq.publishEvent, `github.pull-request.${event.replace(/_/, '-')}`, {
              deliveryId,
              payload: testGithubPayload
            })
          })
      })
    })

    it('should publish job when a pull request is synchronize', () => {
      testGithubPayload.action = 'synchronize'
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledOnce(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.synchronized', {
            deliveryId,
            payload: testGithubPayload
          })
        })
    })

    it('should not publish job when pull request action its not one of the options', () => {
      testGithubPayload.action = 'foo'
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })

    it('should publish job if re-triggered', () => {
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.calledOnce(rabbitmq.publishEvent)
          sinon.assert.calledWith(rabbitmq.publishEvent, 'github.pull-request.opened', {
            deliveryId,
            payload: testGithubPayload
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
            deliveryId,
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

    ;[
      'branch',
      'repository',
      'tag'
    ].forEach((type) => {
      it(`should publish job when a new ${type} is created`, () => {
        headers['x-github-event'] = 'create'
        testGithubPayload.ref_type = type
        const push = request.postAsync({
          url: webhookUrl,
          body: testGithubPayload,
          json: true,
          headers: headers
        })
        return assert.isFulfilled(push)
          .then((data) => {
            assert.equal(data.statusCode, 201)
            sinon.assert.calledOnce(rabbitmq.publishEvent)
            sinon.assert.calledWith(rabbitmq.publishEvent, `github.${type}.created`, {
              deliveryId,
              payload: testGithubPayload
            })
          })
      })
    })

    it('should not publish job when create ref_type its not one of the options', () => {
      headers['x-github-event'] = 'create'
      testGithubPayload.ref_type = 'asdf'
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })

    ;[
      'branch',
      'tag'
    ].forEach((type) => {
      it(`should publish job when a ${type} is deleted`, () => {
        headers['x-github-event'] = 'delete'
        testGithubPayload.ref_type = type
        const push = request.postAsync({
          url: webhookUrl,
          body: testGithubPayload,
          json: true,
          headers: headers
        })
        return assert.isFulfilled(push)
          .then((data) => {
            assert.equal(data.statusCode, 201)
            sinon.assert.calledOnce(rabbitmq.publishEvent)
            sinon.assert.calledWith(rabbitmq.publishEvent, `github.${type}.deleted`, {
              deliveryId,
              payload: testGithubPayload
            })
          })
      })
    })
    it('should not publish job when delete ref_type its not one of the options', () => {
      headers['x-github-event'] = 'delete'
      testGithubPayload.ref_type = 'asdf'
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
        json: true,
        headers: headers
      })
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
          sinon.assert.notCalled(rabbitmq.publishEvent)
        })
    })

    it('should ignore the event ifs not a event we care about', () => {
      headers['x-github-event'] = 'hello'
      const push = request.postAsync({
        url: webhookUrl,
        body: testGithubPayload,
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
        body: testGithubPayload,
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
