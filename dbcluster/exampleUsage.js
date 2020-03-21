const LocalDockerDbCluster = require('./databaseLocalCluster');

const dirname = __dirname;
const redisImageResolver = new RedisImageResolver();

const dockerDbCluster = new LocalDockerDbCluster(redisImageResolver, dirname)
    .withNode({port: 5555})
    .withNode({port: 7777});

dockerDbCluster.run()
    .then(clusterClient => {
        console.log("is started");
    });