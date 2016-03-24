# drake
The Webhook Handler

## Overview
Drake handles webhooks from 3rd-party repository services (e.g. github). Drake
has two sides:

1. HTTP Server - handles webhook requests and enqueues handler jobs.
2. Ponos Worker Server - a worker server that pulls webhook "push" jobs off of
  RabbitMQ and ensures they are properly processed.

Drake says "you used to call me on the cellphone."
