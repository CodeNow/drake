'use strict'

/**
 * Mock github event request options.
 * @type {Object}
 */
module.exports = {
  malformed: {
    headers: { 'content-type': 'text/plain' },
    body: ''
  },
  push: {
    json: true,
    headers: {
      'user-agent': 'GitHub',
      'x-github-event': 'push',
      'x-github-delivery': 'some-delivery-id'
    },
    body: { some: 'body' }
  },
  watch: {
    json: true,
    headers: {
      'user-agent': 'GitHub',
      'x-github-event': 'watch',
      'x-github-delivery': 'some-delivery-id'
    },
    body: { some: 'body' }
  },
  ping: {
    json: true,
    headers: {
      'user-agent': 'GitHub',
      'x-github-event': 'ping',
      'x-github-delivery': 'some-delivery-id'
    },
    body: {
      zen: 'zen string',
      hook_id: 'hook-id',
      hook: 'hook-config'
    }
  }
}
