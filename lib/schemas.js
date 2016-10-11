'use strict'

const joi = require('joi')

exports.datadogHookProcess = joi.object({
  event_msg: joi.string().regex(/\[RUNNABLE_DATA\].*type=.*\[RUNNABLE_DATA\]/).required()
}).unknown().required()

exports.githubPush = joi.object({
  deliveryId: joi.string().required(),
  payload: joi.object().required()
}).unknown().required()

exports.stripeEvent = joi.object({
  stripeEventId: joi.string().required(),
  stripeCustomerId: joi.string()
}).unknown().required()

exports.dockEvent = joi.object({}).unknown().required()
