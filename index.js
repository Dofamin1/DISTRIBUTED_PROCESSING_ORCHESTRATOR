const {log, levels, generateUUID, now} = require("./helpers");
const MonitoringService = require("./monitoringService");
const WebSocketServer = require('./websocketServer');
const RedisDbClient = require('./db/redisDbClient');
const NodeRunners = require("./node/NodeRunners");
const GraphVizBuilder = require('./graph');
const Redis = require('ioredis');
const NODE_ALIVE_TIMEOUT = 10000;
const {ENVIRONMENT} = process.env;

function tryPromise(promise) {
  return new Promise(resolve => {
    promise.then(() => resolve())
      .catch(() => resolve());
  });
}

class WebsocketOrchestrator {
  constructor(nodeRunner, server, nodeAliveTimeout = NODE_ALIVE_TIMEOUT) {
    this.nodeAliveTimeout = nodeAliveTimeout;
    this.websocketServer = server;
    this.nodeRunner = nodeRunner;
    this.nodesToLastTime = new Map();
    this.observedNodes = new Map();
    this.aliveNodes = new Map();
    this.nodesRole = new Map();
  }

  async listenNodes() {
    setInterval(() => {
      this.nodesToLastTime.forEach((time, node) => {
        if (time + this.nodeAliveTimeout < now()) {
          log(`Node ${node.uuid} has been failed`);
          this.aliveNodes.delete(node.uuid);
          this._cleanUpNode(node)
            .then(() => this._runNode(node));
        }
      })
    }, this.nodeAliveTimeout);

    this.websocketServer.addListenEvent('status', res => {
      const {uuid, role} = res.data;
      const node = this.observedNodes.get(uuid);
      if (node) {
        this.nodesToLastTime.set(node, now());
        log(`Status has been accepted: {role ${role}, uuid: ${uuid}}`, levels.DEBUG);
      }
    });
  }

  runNodes() {
    return Promise.all(
      [...this.observedNodes.values()]
        .map(node => this._runNode(node))
    )
    .then(() => log(`Nodes are run`));
  }

  withNodes(nodes) {
    nodes.forEach(node => {
      this.observedNodes.set(node.uuid, node);
      this.nodesRole.set(node.uuid, node.role);
      this.nodesToLastTime.set(node, now());
    });
    return this;
  }

  // noinspection JSUnusedGlobalSymbols
  shutDown() {
    log("init shutdown");
    return Promise.all(
      this.observedNodes.map(node =>
        this.nodeRunner
          .stop({nodeUUID: node.uuid})
          .then(() => this.nodeRunner.remove({nodeUUID: node.uuid}))
      )
    )
    .then(() => log("Instances are turned of and removed"));
  }

  _runNode(node) {
    return this.nodeRunner.run({
      args: [
        `FIRST_START_NODE_STATUS="${node.role}"`,
        `UUID="${node.uuid}"`,
        `WS_HOST="ws://${this.websocketServer.host}:${this.websocketServer.port}"`
      ],
      nodeUUID: node.uuid
    })
    .then(() => this.aliveNodes.set(node.uuid, node.role));
  }

  _cleanUpNode(node) {
    return tryPromise(
      this.nodeRunner.stop({nodeUUID: node.uuid})
        .then(() => tryPromise(
          this.nodeRunner.remove({nodeUUID: node.uuid})
          )
        )
    );
  }
}

function initMonitoringService(orchestrator, webSocketServer) {
  const graphBuilder = new GraphVizBuilder(3);
  const redisDbClient = new RedisDbClient(new Redis());
  return new MonitoringService(orchestrator, webSocketServer, graphBuilder, redisDbClient);
}

function initOrchestrator(nodeRunner, server) {
  const WORKER = "worker";
  const MASTER = "master";
  return new WebsocketOrchestrator(nodeRunner, server)
    .withNodes([
      {host: 'localhost', port: 8000, uuid: generateUUID(), role: MASTER},
      {host: 'localhost', port: 7000, uuid: generateUUID(), role: WORKER},
      {host: 'localhost', port: 6000, uuid: generateUUID(), role: WORKER}
    ]);
}

const webSocketServer = new WebSocketServer('host.docker.internal', 8088);
const nodeRunnerPromise = ENVIRONMENT === 'docker' ?
  NodeRunners.creteDockerRunner('vorobyov/processing-nodes') :
  ENVIRONMENT === 'local' ?
    NodeRunners.createLoggableRunner() :
    Promise.reject(new Error("ENVIRONMENT is not defined"));

(async () => {
  const orchestrator = initOrchestrator(await nodeRunnerPromise, webSocketServer);
  initMonitoringService(orchestrator, webSocketServer)
    .monitoring();
  orchestrator.runNodes()
    .then(() => orchestrator.listenNodes());
})();
