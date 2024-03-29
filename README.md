# drake
![Drake](https://raw.githubusercontent.com/CodeNow/drake/master/logo.jpg?token=AAI8oKLQgDfT7mzr_gIL4TYT1fBgbMQRks5W_HskwA%3D%3D)

## Overview
Drake is the **dopest** webhook handler. Specifically, Drake handles webhooks
from 3rd-party repository services (e.g. github, bitbucket, etc.) by way of his
two natures:

1. HTTP Server - handles webhook requests and enqueues handler jobs.
2. Ponos Worker Server - a worker server that pulls webhook "push" jobs off of
  RabbitMQ and ensures they are properly processed.

## RESTful Endpoints
Drake responds to the following HTTP endpoints (esp. on his cellphone):

- `POST /github` - Handles GitHub Webhook requests

## Events
Drake emit following events

- `github.pushed` - take payload from github webhook and send's it as an event.

## Testing
Currently, Drake is tested via **functional tests**. Drake reminds you that
letting the functional tests bloat will "get him down" and leave him "stressed out".

Thus when adding features take care to keep the number of tests down by way of
keeping Drake's cyclomatic complexity low.

## Final Thoughts
If in doubt, remember: Drake is more than willing to answer late at night when you
"need his love".
