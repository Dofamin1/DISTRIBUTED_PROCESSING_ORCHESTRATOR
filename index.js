const {log, levels, generateUUID, now} = require("./helpers");
const NodeRunners = require("./node/NodeRunners");
const WebSocketServer = require('./websocketServer');
const {ENVIRONMENT} = process.env;
const NODE_ALIVE_TIMEOUT = 10000;

function tryPromise(promise) {
  return new Promise(resolve => {
    promise.then(() => resolve())
      .catch(() => resolve());
  });
}

class WebsocketOrchestrator {
  constructor(nodeRunner, nodeAliveTimeout = NODE_ALIVE_TIMEOUT, port = 8080, host = 'localhost') {
    this.websocketServer = new WebSocketServer(port);
    this.nodeAliveTimeout = nodeAliveTimeout;
    this.nodeRunner = nodeRunner;
    this.nodesToLastTime = new Map();
    this.observedNodes = new Map();
    this.nodesRole = new Map();
    this.port = port;
    this.host = host;
  }

  async listenNodes() {
    setInterval(() => {
      this.nodesToLastTime.forEach((time, node) => {
        if (time + this.nodeAliveTimeout < now()) {
          log(`Node ${node.uuid} has been failed`);
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
        `WS_HOST="ws://${this.host}:${this.port}"`
      ],
      nodeUUID: node.uuid
    });
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

const WORKER = "worker";
const MASTER = "master";

const nodeRunnerPromise = ENVIRONMENT === 'docker' ?
  NodeRunners.creteDockerRunner('vorobyov/processing-nodes') :
  ENVIRONMENT === 'local' ?
    NodeRunners.createLoggableRunner() :
    Promise.reject(new Error("ENVIRONMENT is not defined"));

nodeRunnerPromise
  .then(nodeRunner =>
    new WebsocketOrchestrator(nodeRunner)
      .withNodes([
        {host: 'localhost', port: 8000, uuid: MASTER, role: MASTER},
        {host: 'localhost', port: 7000, uuid: WORKER, role: WORKER}
      ])
  )
  .then(orchestrator =>
    orchestrator
      .runNodes()
      .then(() => orchestrator.listenNodes())
  );
