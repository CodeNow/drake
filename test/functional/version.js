'use strict'

require('loadenv')({ debugName: 'drake:test' })

const chai = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert

const Promise = require('bluebird')
const request = Promise.promisifyAll(require('request'))

const httpServer = require('../../lib/http/server')
const rabbitmq = require('../../lib/rabbitmq')
const workerServer = require('../../lib/worker/server')

describe('functional', () => {
  const versionURL = `http://localhost:${process.env.PORT}/version`

  describe('Version Endpoint', () => {
    before(() => {
      return rabbitmq.connect()
        .then(() => { return workerServer.start() })
        .then(() => { return httpServer.start() })
    })

    after(() => {
      return httpServer.stop()
        .then(() => { return workerServer.stop() })
        .then(() => { return rabbitmq.disconnect() })
    })

    it('should respond with the version and name', () => {
      const check = request.getAsync(versionURL)
      return assert.isFulfilled(check)
        .then((data) => {
          assert.equal(data.statusCode, 200)
          const res = JSON.parse(data.body)
          assert.equal(res.name, 'drake')
          assert.match(res.version, /^\d+\.\d+\.\d+$/)
        })
    })
  })
})
