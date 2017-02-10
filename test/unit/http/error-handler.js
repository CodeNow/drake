'use strict'
const chai = require('chai')
const sinon = require('sinon')

const errorHandaler = require('../../../lib/http/error-handler')

chai.use(require('chai-as-promised'))

describe('errorHandaler unit test', () => {
  let codeStub
  const replyStub = () => {
    return {
      code: codeStub
    }
  }
  beforeEach(() => {
    codeStub = sinon.stub()
  })

  it('should return 400 if joi error', () => {
    errorHandaler({
      isJoi: true
    }, replyStub)
    sinon.assert.calledOnce(codeStub)
    sinon.assert.calledWith(codeStub, 400)
  })

  it('should return 500 if not joi error', () => {
    errorHandaler({
      isJoi: false
    }, replyStub)
    sinon.assert.calledOnce(codeStub)
    sinon.assert.calledWith(codeStub, 500)
  })
})
