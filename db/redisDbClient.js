const serialize = require('serialize-javascript');

const STACK_NAME = 'stack';

class RedisDbClient {
  constructor(client) {
    this.client = client;
  }

  async queueLen() {
    return this.client.llen(STACK_NAME);
  }
}

module.exports = RedisDbClient;