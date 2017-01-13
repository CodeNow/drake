'use strict'

const joi = require('joi')

exports.datadogHookProcess = joi.object({
  event_msg: joi.string().regex(/\[RUNNABLE_DATA\].*type=.*\[RUNNABLE_DATA\]/).required()
}).unknown().required()

exports.prometheusHookProcess = joi.object({
  status: joi.string().required(),
  labels: joi.object({
    type: joi.string().required(),
    hostIp: joi.string().ip().required(),
    githubOrgId: joi.string().required()
  }).unknown().required()
}).unknown().required()

exports.psadHookProcess = joi.object({
  containerId: joi.string().required(),
  logs: joi.string()
}).unknown().required()


exports.githubEvent = joi.object({
  deliveryId: joi.string().required(),
  payload: joi.object().required()
}).unknown().required()

exports.stripeEvent = joi.object({
  stripeEventId: joi.string().required(),
  stripeCustomerId: joi.string()
}).unknown().required()

exports.dockEvent = joi.object({}).unknown().required()
