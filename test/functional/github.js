'use strict'

require('loadenv')({ debugName: 'drake:test' })

const chai = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const sinon = require('sinon')

const MockAPI = require('../fixtures/mock-api')
const Promise = require('bluebird')
const events = require('../fixtures/github-events.js')
const Joi = Promise.promisifyAll(require('joi'))
const request = Promise.promisifyAll(require('request'))

const api = Promise.promisifyAll(new MockAPI(7890))

const hermes = require('../../lib/hermes')
const httpServer = require('../../lib/http/server')
const workerServer = require('../../lib/worker/server')

describe('functional', () => {
  const webhookUrl = `http://localhost:${process.env.PORT}/github`

  describe('Github Webhook', () => {
    before(() => {
      return hermes.connectAsync()
        .then(() => { return workerServer.start() })
        .then(() => { return httpServer.start() })
        .then(() => { return api.startAsync() })
    })

    after(() => {
      return api.stopAsync()
        .then(() => { return httpServer.stop() })
        .then(() => { return workerServer.stop() })
    })

    beforeEach(() => {
      api.stub('POST', '/actions/github').returns(202)
    })

    afterEach(() => {
      api.restore()
    })

    it('should respond to push events then enqueue and handle the job', () => {
      const push = request.postAsync(webhookUrl, events.push)
      return assert.isFulfilled(push)
        .then((data) => {
          assert.equal(data.statusCode, 201)
        })
        .then(() => { return Promise.delay(300) })
        .then(() => {
          sinon.assert.calledOnce(api.stub('POST', '/actions/github'))
        })
    })

    it('should retry until the job passes', () => {
      const stub = api.stub('POST', '/actions/github')
      stub.onFirstCall().returns(500)
        .onSecondCall().returns(500)
      const push = request.postAsync(webhookUrl, events.push)
      return assert.isFulfilled(push)
        .then(() => { return Promise.delay(300) })
        .then(() => {
          assert.equal(stub.callCount, 3)
        })
    })

    it('should respond to ping events', () => {
      const ping = request.postAsync(webhookUrl, events.ping)
      return assert.isFulfilled(ping)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          assert.equal(data.body, 'pong')
        })
    })

    it('should ignore all other webhook events', () => {
      const watch = request.postAsync(webhookUrl, events.watch)
      return assert.isFulfilled(watch)
        .then((data) => {
          assert.equal(data.statusCode, 202)
        })
    })

    it('should reject malformed web-hook requests', () => {
      const malformed = request.postAsync(webhookUrl, events.malformed)
      return assert.isFulfilled(malformed)
        .then((data) => {
          assert.equal(data.statusCode, 400)
          assert.equal(data.body, 'Invalid Webhook Request')
        })
    })

    it('should fatally reject malformed jobs', () => {
      const stub = api.stub('POST', '/actions/github')
      return Promise.resolve()
        .then(() => {
          hermes.publish('github.push', { deliveryId: 'fools' })
          return Promise.delay(500)
        })
        .then(() => {
          assert.equal(stub.callCount, 0)
        })
    })

    it('should gracefully handle unexpected errors', () => {
      sinon.stub(Joi, 'validateAsync', () => { throw Error('oopsies...') })
      const ping = request.postAsync(webhookUrl, events.ping)
      return assert.isFulfilled(ping)
        .then((data) => {
          assert.equal(data.statusCode, 500)
          assert.equal(data.body, 'Internal Server Error')
        })
        .finally(() => {
          Joi.validateAsync.restore()
        })
    })
  }) // end 'Github Webhook'
}) // end 'functional'
