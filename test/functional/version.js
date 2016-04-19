'use strict'

require('loadenv')({ debugName: 'drake:test' })

const chai = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert

const MockAPI = require('../fixtures/mock-api')
const Promise = require('bluebird')
const request = Promise.promisifyAll(require('request'))

const api = Promise.promisifyAll(new MockAPI(7890))

const hermes = require('../../lib/hermes')
const httpServer = require('../../lib/http/server')
const workerServer = require('../../lib/worker/server')

describe('functional', () => {
  const versionURL = `http://localhost:${process.env.PORT}/version`

  describe('Version Endpoint', () => {
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
