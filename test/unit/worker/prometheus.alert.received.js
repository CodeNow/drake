'use strict'
const chai = require('chai')
const sinon = require('sinon')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const rabbitmq = require('../../../lib/rabbitmq')
const Worker = require('../../../lib/worker/prometheus.alert.received')

chai.use(require('chai-as-promised'))
const assert = chai.assert

describe('prometheus.alert.received unit test', function () {
  describe('_getEventNameFromType', () => {
    it('should return dock.disk.filled', (done) => {
      const out = Worker._getEventNameFromType('disk_filled')
      assert.equal(out, 'dock.disk.filled')
      done()
    })

    it('should return dock.memory.exhausted', (done) => {
      const out = Worker._getEventNameFromType('memory_exhausted')
      assert.equal(out, 'dock.memory.exhausted')
      done()
    })

    it('should return dock.unresponsive', (done) => {
      const out = Worker._getEventNameFromType('unresponsive')
      assert.equal(out, 'dock.unresponsive')
      done()
    })

    it('should throw worker stop', (done) => {
      assert.throws(() => {
        Worker._getEventNameFromType('not-a-thing')
      }, WorkerStopError)
      done()
    })
  })

  describe('task', () => {
    beforeEach(() => {
      sinon.stub(rabbitmq, 'publishEvent')
      sinon.stub(Worker, '_getEventNameFromType')
    })

    afterEach(() => {
      rabbitmq.publishEvent.restore()
      Worker._getEventNameFromType.restore()
    })

    it('should do nothing if not firing', (done) => {
      Worker.task({
        status: 'resolved'
      })
      .then(() => {
        sinon.assert.notCalled(rabbitmq.publishEvent)
        sinon.assert.notCalled(Worker._getEventNameFromType)
      })
      .asCallback(done)
    })

    it('should publish correct event', (done) => {
      const testEventName = 'test.event.fired'
      Worker._getEventNameFromType.returns(testEventName)
      Worker.task({
        status: 'firing',
        labels: {
          type: 'disk',
          hostIp: '10.0.0.1'
        }
      })
      .then(() => {
        sinon.assert.calledOnce(rabbitmq.publishEvent)
        sinon.assert.calledWith(rabbitmq.publishEvent, testEventName, {
          type: 'disk',
          hostIp: '10.0.0.1',
          host: 'http://10.0.0.1:4242'
        })
      })
      .asCallback(done)
    })
  }) // end task
}) // end prometheus.alert.received unit test
