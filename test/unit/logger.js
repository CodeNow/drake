'use strict'
const chai = require('chai')

const logger = require('../../lib/logger')

chai.use(require('chai-as-promised'))
const assert = chai.assert

describe('logger unit test', function () {
  it('should remove commits fromjob', () => {
    const testJob = {
      payload: {
        commits: ['some', 'commits']
      }
    }
    const out = logger._serializers.job(testJob)
    assert.deepEqual({ payload: {} }, out)
  })
}) // end logger unit test
