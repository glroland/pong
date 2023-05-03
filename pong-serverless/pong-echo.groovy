// camel-k: language=groovy
from('timer:messages?period=10000')
  .setBody().constant('Hello World')
  .to('log:info')
  .to('knative:channel/pong-events')


