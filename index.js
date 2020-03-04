const {log} = require("./helpers");
const uuid = require("uuid");
const EventController = require('./eventController');
const Redis = require('ioredis');
const RedisDbClient = require('db/redisDbClient');

class Orchestrator {
    constructor(dbClient, nodeRunner) {
        this.eventController = new EventController();
        this.dbClient = dbClient;
        this.nodeRunner = nodeRunner;
        this.observedNodes = [];
        this.masterUuid;
        this.freeNodes = [];
        this.freeNodes.push = (item) => {
            Array.prototype.push.call(this, item);
            this._doForward();
        };
    }

    listenNodes() {
        const checkIfAlive = () => this.eventController.sendEvent(
            {type: 'status'},
            res => {
                if (res.free) {
                    this.freeNodes.push({})
                }

            }
        );
        setInterval(checkIfAlive, 10000);
        return this;
    }

    forwardTasks() {
        this._doForward();
        return this;
    }

    runNodes() {
        return this.observedNodes.map(node => this.nodeRunner.run(node));
    }

    _doForward() {
        this.freeNodes.map(node => {
            return this.dbClient.nextTask()
                .then(task => {
                    if (task) this._sendTask(node, task)
                });
        });
    }

    withNodes(nodes) {
        this.observedNodes.push(nodes);
    }

    _sendTask(node, task) {
        this.eventController.publishEvent({
            eventName: 'task',
            val: JSON.stringify(task)
        });
    }
}

const redisDbClient = new RedisDbClient(new Redis());
const nodeRunner = new DockerNodeRunner();

const orchestrator = new Orchestrator(redisDbClient, nodeRunner)
    .withNodes([
        {host: 'localhost', port: 7777, id: uuid},
        {host: 'localhost', port: 8888}
    ]);

orchestrator.runNodes()
    .then(() => {
        orchestrator
            .listenNodes()
            .forwardTasks();
    });

