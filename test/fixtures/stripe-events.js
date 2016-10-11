'use strict'

/**
 * Mock github event request options.
 * @type {Object}
 */
module.exports = {
  malformed: {
    'object': 'event',
    'api_version': '2015-10-12',
    'created': 1470185308,
    'data': {},
    'livemode': false,
    'pending_webhooks': 0,
    'request': 'req_8w5kR3LRuAl6hU',
    'type': 'customer.subscription.created'
  },
  unhandled: {
    'id': 'evt_18eDYeLYrJgOrBWzMApFSM7T',
    'object': 'event',
    'api_version': '2015-10-12',
    'created': 1470185308,
    'data': {},
    'livemode': false,
    'pending_webhooks': 0,
    'request': 'req_8w5kR3LRuAl6hU',
    'type': 'customer.subscription.created'
  },
  'invoice.created': {
    'id': 'evt_18eDYeLYrJgOrBWzMApFSM11',
    'object': 'event',
    'api_version': '2015-10-12',
    'created': 1470185308,
    'data': {
      'object': {
        'customer': 'cus_9MINKbWDTLUkV3'
      }
    },
    'livemode': false,
    'pending_webhooks': 0,
    'request': 'req_8w5kR3LRuAl6hU',
    'type': 'invoice.created'
  },
  'invoice.payment_succeeded': {
    'id': 'evt_18eDYeLYrJgOrBWzMApFSM22',
    'object': 'event',
    'api_version': '2015-10-12',
    'created': 1470185308,
    'data': {},
    'livemode': false,
    'pending_webhooks': 0,
    'request': 'req_8w5kR3LRuAl6hU',
    'type': 'invoice.payment_succeeded'
  },
  'invoice.payment_failed': {
    'id': 'evt_18eDYeLYrJgOrBWzMApFSM33',
    'object': 'event',
    'api_version': '2015-10-12',
    'created': 1470185308,
    'data': {},
    'livemode': false,
    'pending_webhooks': 0,
    'request': 'req_8w5kR3LRuAl6hU',
    'type': 'invoice.payment_failed'
  }
}
