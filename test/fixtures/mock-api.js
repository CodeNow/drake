'use strict'

const http = require('http')
const isFunction = require('101/is-function')
const isNumber = require('101/is-number')
const isObject = require('101/is-object')
const isString = require('101/is-string')
const noop = require('101/noop')
const sinon = require('sinon')
const debug = require('debug')('mock-api')

/**
 * Mock API server. Allows one to mock any api and setup stubs for particlar
 * routes (via sinon).
 *
 * Note: use `DEBUG=mock-api` to see request and responses via debug.
 *
 * @example
 * // Start the server up before all tests
 * const api = new MockAPI(8901)
 * before((done) => { api.start(done) })
 * after((done) => { api.stop(done) })
 *
 * // Setup some stubs before each test
 * beforeEach(() => {
 *   // First argument is the method, the second is the path
 *   // Returns a sinon stub that you can use per usual.
 *   api.stub('POST', '/actions/github')
 *     .onFirstCall().returns(500)
 *     .onSecondCall().returns(202)
 *
 *   // Omitting the "method" parameter assumes its a "GET" request...
 *   api.stub('/users/me').returns({
 *     status: 200,
 *     body: { id: 'some-user-id' }
 *   })
 * })
 *
 * // Restore all stubs after each test
 * afterEach(() => {
 *   api.restore()
 * })
 *
 * // Use it in a test!
 * it('should call /users/me', (done) => {
 *   someActionThatCallsAPI(() => {
 *     sinon.calledOnce(api.stub('/users/me'))
 *     done()
 *   })
 * })
 *
 * @author Ryan Sandor Richards
 */
module.exports = class MockAPI {
  /**
   * Creates a new mock api server.
   * @param {Integer} port The port for the api server.
   */
  constructor (port) {
    this.port = port
    this.restore()
    this.server = http.createServer(this.handler.bind(this))
  }

  /**
   * Starts the mock api server.
   * @param {function} done Callback to execute once the server is listening.
   */
  start (done) {
    if (!isFunction(done)) {
      done = noop
    }
    this.server.listen(this.port, (err) => {
      if (err) {
        debug(`Failed to start server (port: ${this.port})`)
        debug(err.message)
        done(err)
      }
      debug(`Server listening (port: ${this.port})`)
      done()
    })
  }

  /**
   * Stops the mock api server.
   * @param {function} done Callback to execute once the server is stopped.
   */
  stop (done) {
    if (!isFunction(done)) {
      done = noop
    }
    this.server.close((err) => {
      debug(`Server stopped (port: ${this.port})`)
      done(err)
    })
  }

  /**
   * Handles incoming requests to the mock server. This will call stub methods
   * appropriately.
   */
  handler (request, response) {
    const method = request.method
    const path = request.url
    const routeStub = this.stub(method, path)
    const result = routeStub(request, response)

    debug(`Request: ${method} ${path}`)

    let status = 200
    let body = 'response'
    let contentType = 'text/plain'

    if (isNumber(result)) {
      status = result
    } else if (isString(result)) {
      body = result
    } else if (isObject(result)) {
      if (isNumber(result.status)) {
        status = result.status
      }
      if (isObject(result.body)) {
        contentType = 'application/json'
        body = JSON.stringify(result.body)
      } else if (result.body) {
        body = result.body.toString()
      }
    }

    debug(`Response: ${status} ${body} (${contentType})`)

    response.writeHead(status, { 'Content-Type': contentType })
    response.end(body)
  }

  /**
   * Returns the stub method for a route on the server.
   * @param {string} [method] HTTP Method for the request stub (ex: PUT, POST).
   * @param {string} path Path to stub (ex: /users/me)
   */
  stub (method, path) {
    if (!path) {
      path = method
      method = 'GET'
    }
    method = method.toUpperCase()

    const key = `${method} ${path}`
    if (!this.routeStubs[key]) {
      this.routeStubs[key] = sinon.stub()
    }
    return this.routeStubs[key]
  }

  /**
   * Restores all stubbed routes on the mock api server.
   */
  restore () {
    this.routeStubs = {}
  }
}
