'use strict'

/**
 * @type {Object}
 */
module.exports = {
  valid: {
    receiver: 'drake',
    status: 'firing',
    alerts: [
      {
        status: 'firing',
        labels: {
          alertname: 'HookDockUnresponsive',
          githubOrgId: '20547680',
          hostIp: '10.4.129.107',
          type: 'disk_filled'
        },
        annotations: {
          description: 'Dock unresponsive host=10.4.129.107 org=20547680'
        },
        startsAt: '2016-12-20T00:58:37.811Z',
        endsAt: '0001-01-01T00:00:00Z',
        generatorURL: 'http://localhost/graph?g0.expr=up+%3D%3D+0&g0.tab=0'
      },
      {
        status: 'resolved',
        labels: {
          alertname: 'HookDockUnresponsive',
          githubOrgId: '20547680',
          hostIp: '10.4.129.2',
          type: 'memory_exhausted'
        },
        annotations: {
          description: 'Dock unresponsive host=10.4.129.2 org=20547680'
        },
        startsAt: '2016-12-20T00:58:37.811Z',
        endsAt: '0001-01-01T00:00:00Z',
        generatorURL: 'http://localhost/graph?g0.expr=up+%3D%3D+0&g0.tab=0'
      }
    ],
    groupLabels: {
      alertname: 'HookDockUnresponsive'
    },
    commonLabels: {
      alertname: 'HookDockUnresponsive'
    },
    commonAnnotations: {
    },
    externalURL: 'http://localhost',
    version: '3',
    groupKey: 4990955025252445000
  }
}
