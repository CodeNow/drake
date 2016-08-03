'use strict'

require('loadenv')({ debugName: 'drake:test' })

const chai = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const sinon = require('sinon')

const MockAPI = require('../fixtures/mock-api')
const Promise = require('bluebird')
const events = require('../fixtures/stripe-events.js')
const Joi = Promise.promisifyAll(require('joi'))
const request = Promise.promisifyAll(require('request'))

const httpServer = require('../../lib/http/server')
const rabbitmq = require('../../lib/rabbitmq')
const workerServer = require('../../lib/worker/server')

const webhookUrl = `http://localhost:${process.env.PORT}/stripe`

describe('Stripe Webhook Functional', () => {
  let publishEventStub

  before('Start HTTP and Worker Server', () => {
    return httpServer.start()
      .then(() => workerServer.start())
  })

  beforeEach('Stub out RabbitMQ', () => {
    publishEventStub = sinon.stub(rabbitmq, 'publishEvent')
  })

  after('Stop HTTP and Worker Server', () => {
    return httpServer.stop()
      .then(() => workerServer.stop())
  })

  afterEach('Restore RabbitMQ', () => {
    publishEventStub.restore()
  })

 it('should respond to unhanlded webhook events with a 204', () => {
   const push = request.postAsync({
     url: webhookUrl,
     body: events.unhandled,
     json: true
   })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.statusCode, 204)
      })
  })

  it('should respond to malformed webhook event with a 400', () => {
    const push = request.postAsync({
      url: webhookUrl,
      body: events.malformed,
      json: true
    })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.statusCode, 400)
      })
  })

  it('should publish a `stripe.invoice.created` event if an `invoice.created` webhook is recevied', () => {
    const push = request.postAsync({
      url: webhookUrl,
      body: events['invoice.created'],
      json: true
    })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.statusCode, 200)
        sinon.assert.calledOnce(publishEventStub)
        sinon.assert.calledWithExactly(
          publishEventStub,
          'stripe.invoice.created',
          {
            stripeEventId: events['invoice.created'].id
          }
        )
      })
  })

  it('should publish a `stripe.invoice.payment-failed` event if an `invoice.payment_failed` webhook is recevied', () => {
    const push = request.postAsync({
      url: webhookUrl,
      body: events['invoice.payment_failed'],
      json: true
    })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.statusCode, 200)
        sinon.assert.calledOnce(publishEventStub)
        sinon.assert.calledWithExactly(
          publishEventStub,
          'stripe.invoice.payment-failed',
          {
            stripeEventId: events['invoice.payment_failed'].id
          }
        )
      })
  })

  it('should publish a `stripe.invoice.payment-succeeded` event if an `invoice.payment_succeeded` webhook is recevied', () => {
    const push = request.postAsync({
      url: webhookUrl,
      body: events['invoice.payment_succeeded'],
      json: true
    })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.statusCode, 200)
        sinon.assert.calledOnce(publishEventStub)
        sinon.assert.calledWithExactly(
          publishEventStub,
          'stripe.invoice.payment-succeeded',
          {
            stripeEventId: events['invoice.payment_succeeded'].id
          }
        )
      })
  })

  it('should gracefully handle unexpected errors', () => {
    sinon.stub(Joi, 'validateAsync', () => { throw Error('oopsies...') })
    const push = request.postAsync({
      url: webhookUrl,
      body: events.malformed,
      json: true
    })
    return assert.isFulfilled(push)
      .then((data) => {
        assert.equal(data.body.statusCode, 500)
        assert.equal(data.body.error, 'Internal Server Error')
      })
      .finally(() => {
        Joi.validateAsync.restore()
      })
  })
}) // end 'Github Webhook'
