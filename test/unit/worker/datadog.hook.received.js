'use strict'
const chai = require('chai')
const sinon = require('sinon')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const rabbitmq = require('../../../lib/rabbitmq')
const Worker = require('../../../lib/worker/datadog.hook.received')

chai.use(require('chai-as-promised'))
const assert = chai.assert

describe('datadog.hook.received unit test', function () {
  beforeEach(() => {
    sinon.stub(rabbitmq, 'publishEvent')
  })

  afterEach(() => {
    rabbitmq.publishEvent.restore()
  })

  it('should publish disk_filled with correct data', () => {
    const testData = {
      test1: 'hop',
      type: 'disk_filled'
    }
    const testMsg = Object.keys(testData).reduce((prev, cur) => {
      console.log('prev', prev, prev.push)
      prev.push(`${cur}=${testData[cur]}`)
      return prev
    }, []).join(',')
    const testJob = {
      event_msg: `%%%\n[RUNNABLE_DATA]${testMsg}[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n...%%%`
    }
    return assert.isFulfilled(Worker.task(testJob))
      .then(() => {
        sinon.assert.calledOnce(rabbitmq.publishEvent)
        sinon.assert.calledWith(rabbitmq.publishEvent, 'dock.disk.filled', testData)
      })
  })

  it('should publish memory_exhausted with correct data', () => {
    const testData = {
      test1: 'hop',
      type: 'memory_exhausted'
    }
    const testMsg = Object.keys(testData).reduce((prev, cur) => {
      console.log('prev', prev, prev.push)
      prev.push(`${cur}=${testData[cur]}`)
      return prev
    }, []).join(',')
    const testJob = {
      event_msg: `%%%\n[RUNNABLE_DATA]${testMsg}[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n lots of crap%%%`
    }
    return assert.isFulfilled(Worker.task(testJob))
      .then(() => {
        sinon.assert.calledOnce(rabbitmq.publishEvent)
        sinon.assert.calledWith(rabbitmq.publishEvent, 'dock.memory.exhausted', testData)
      })
  })

  it('should publish unresponsive with correct data', () => {
    const testData = {
      test1: 'hop',
      type: 'unresponsive'
    }
    const testMsg = Object.keys(testData).reduce((prev, cur) => {
      console.log('prev', prev, prev.push)
      prev.push(`${cur}=${testData[cur]}`)
      return prev
    }, []).join(',')
    const testJob = {
      event_msg: `%%%\n[RUNNABLE_DATA]${testMsg}[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n...%%%`
    }
    return assert.isFulfilled(Worker.task(testJob))
      .then(() => {
        sinon.assert.calledOnce(rabbitmq.publishEvent)
        sinon.assert.calledWith(rabbitmq.publishEvent, 'dock.unresponsive', testData)
      })
  })

  it('should WorkerStopError if bad event', () => {
    const testData = {
      type: 'I think something is going on, please help'
    }
    const testMsg = Object.keys(testData).reduce((prev, cur) => {
      console.log('prev', prev, prev.push)
      prev.push(`${cur}=${testData[cur]}`)
      return prev
    }, []).join(',')
    const testJob = {
      event_msg: `%%%\n[RUNNABLE_DATA]${testMsg}[RUNNABLE_DATA]\n@webhook-gamma-drake\n\n...%%%`
    }
    return assert.isRejected(Worker.task(testJob), WorkerStopError)
  })
}) // end datadog.hook.received unit test
