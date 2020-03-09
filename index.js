const {log, levels, generateUUID} = require("./helpers");
const NodeRunners = require("./node/DockerNodeRunner");
const {ENVIRONMENT} = process.env;
// noinspection SpellCheckingInspection

const DEFAULT_TIMEOUT = 10000;

class Orchestrator {
  constructor(nodeRunner, timeout = DEFAULT_TIMEOUT) {
    this.observedNodes = [];
    this.nodeRunner = nodeRunner;
    this.timeout = timeout;
    this.statusLast = new Map();
  }

  async listenNodes() {
    log("Status is being checked");
    //TODO: implement
  }

  

  runNodes() {
    return Promise.all(
      this.observedNodes.map(node => this._runNode(node))
    ).then(() => log(`Nodes are run`));
  }

  withNodes(nodes) {
    this.observedNodes.push(...nodes);
    nodes.forEach(node => this.statusLast.set(node.uuid, node.role));
    log(
      `Nodes {alive: ${this.statusLast.size}, total: ${
        this.observedNodes.length
      }}`
    );
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
    ).then(() => log("Instances are turned of and removed"));
  }

  _runNode(node) {
    return this.nodeRunner.run({
      args: `FIRST_START_NODE_STATUS=${node.isMaster} UUID=${node.uuid}`,
      nodeUUID: node.uuid
    });
  }

  _cleanUpNode(node) {
    return this.nodeRunner.remove({nodeUUID: node.uuid});
  }

  _runFailedNodes() {
    return new Promise(resolve => {
      log(
        `Nodes {alive: ${this.statusLast.size}, total: ${
          this.observedNodes.length
        }}`
      );
      if (this.statusLast.size !== this.observedNodes.length) {
        const failedNodes = this.observedNodes.filter(
          node => !this.statusLast.get(node.uuid)
        );
        Promise.all(
          failedNodes.map(node =>
            this._cleanUpNode(node).then(() => this._runNode(node))
          )
        )
          .then(() => resolve(failedNodes.length))
          .then(() => failedNodes.length !== 0 ? log(`Failed nodes is recovered`) : null);
      } else {
        resolve(0);
      }
    });
  }
}

const WORKER = "worker";
const MASTER = "master";

const nodeRunnerPromise = ENVIRONMENT === 'docker' ?
  NodeRunners.creteDockerRunner('nodes') :
  ENVIRONMENT === 'local' ?
    NodeRunners.createLoggableRunner() :
    Promise.reject(new Error("ENVIRONMENT is not defined"));

nodeRunnerPromise
  .then(nodeRunner =>
    new Orchestrator(nodeRunner).withNodes([
      {uuid: MASTER, role: MASTER},
      {uuid: WORKER, role: WORKER}
    ])
  )
  .then(orchestrator =>
    orchestrator
      .runNodes()
      .then(() => orchestrator.listenNodes())
  );
