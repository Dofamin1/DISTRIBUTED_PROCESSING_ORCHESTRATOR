const Redis = require('ioredis');

class RedisImageResolver {
    get name() {
        return 'redis';
    }

    get configFileName() {
        return '/usr/local/etc/redis/redis.conf';
    }

    get secondName() {
        return 'redis-server'
    }

    resolveClient(nodes) {
        return new Redis.Cluster(nodes);
    }

    resolveConfigData(port) {
        return `port ${port}
                cluster-enabled yes
                cluster-config-file node.conf
                cluster-node-timeout 5000
                appendonly yes`
    }
}

module.exports = RedisImageResolver;