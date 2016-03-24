# drake
The Webhook Handler

## Overview
Drake handles webhooks from 3rd-party repository services (e.g. github). Drake
has two sides:

1. HTTP Server - handles webhook requests and enqueues handler jobs.
2. Ponos Worker Server - a worker server that pulls webhook "push" jobs off of
  RabbitMQ and ensures they are properly processed.

Drake says "you used to call me on the cellphone."

## RESTful Endpoints

- `POST /github` - Handles GitHub Webhook requests

## Queues

- `github.push` - Handles github push events and ensures that the runnable API
  gets the job done.
