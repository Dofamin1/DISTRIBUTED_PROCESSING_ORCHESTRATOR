
const serialize = require('serialize-javascript');

const STACK_NAME = 'stack';

class RedisDbClient {
    constructor(client) {
        this.client = client;
    }

    async nextTask(task) {
        return this.client.lpop(STACK_NAME);
    }

    async pushTask(task) {
        if (!task.execute instanceof Function) {
            throw new Error("Method execute is not implemented");
        }
        return this.client.lpush(STACK_NAME, serialize(task));
    }
}

module.exports = RedisDbClient;