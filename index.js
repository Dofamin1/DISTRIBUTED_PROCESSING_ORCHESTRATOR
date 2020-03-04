const {log} = require("./helpers");
const EventController = require('./eventController');
const dockerRunnerInitializer = require('./node/DockerNodeRunner');
// noinspection SpellCheckingInspection
const uuidv4 = require('uuid/v4');

const DEFAULT_TIMEOUT = 10000;

class Orchestrator {
    constructor(nodeRunner, timeout = DEFAULT_TIMEOUT) {
        this.eventController = new EventController();
        this.observedNodes = [];
        this.nodeRunner = nodeRunner;
        this.timeout = timeout;
        this.statusLast = new Map();
    }

    listenNodes() {
        setInterval(async () => {
            log("Status is being checked");
            this.eventController.publishEvent({
                eventName: 'nodes_list',
                val: Array.from(this.statusLast.keys())
            });
            await this._runFailedNodes();
            this.statusLast.clear();
            this.eventController.sendEvent({type: 'status'}, res => {
                this.statusLast.set(res.uuid, res.role);
            });
        }, this.timeout);
    }

    runNodes() {
        return Promise.all(
            this.observedNodes.map(node => this._runNode(node))
        )
        .then(() => log(`Nodes is runner`));
    }

    withNodes(nodes) {
        log(`Nodes {alive: ${this.statusLast.size}, total: ${this.observedNodes.length}}`);
        this.observedNodes.push(...nodes);
        nodes.forEach(node => this.statusLast.set(node.uuid, node.role));
        return this;
    }

    shutDown() {
        log('init shutdown');
        return Promise.all(
            this.observedNodes.map(node => this.nodeRunner.stop({containerId: node.uuid}))
        )
        .then(() => log('Is turned of'));
    }

    _runNode(node) {
        return this.nodeRunner.run({
            host: node.host,
            port: node.port,
            args: `FIRST_START_NODE_STATUS=${node.isMaster} UUID=${node.uuid}`,
            containerId: node.uuid
        });
    }

    _runFailedNodes() {
        return new Promise(resolve => {
            log(`Nodes {alive: ${this.statusLast.size}, total: ${this.observedNodes.length}}`);
            if (this.statusLast.size !== this.observedNodes.length) {
                const failedNodes = this.observedNodes.filter(node => !this.statusLast.get(node.uuid));
                Promise.all(failedNodes.map(node => this._runNode(node)))
                    .then(() => resolve(failedNodes.length))
                    .then(() => log(`Failed nodes is recovered: ${failedNodes}`));
            } else {
                resolve(0);
            }
        });
    }
}

const NODE = 'node';
const MASTER = 'master';

dockerRunnerInitializer("dopamin1/distributed_processing_node")
    .then(nodeRunner => new Orchestrator(nodeRunner)
        .withNodes([
            {host: 'localhost', port: 7777, uuid: uuidv4(), role: MASTER},
            {host: 'localhost', port: 8888, uuid: uuidv4(), role: NODE}
        ])
    )
    .then(orchestrator => orchestrator.runNodes()
        .then(() => orchestrator.listenNodes())
        .then(() => setTimeout(orchestrator.shutDown, 90000))
    );


