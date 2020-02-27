const cote = require("cote");
const { log } = require("./helpers")
const exampleTask = {
    command: 'do something'
}

class EventController {
    constructor() {
        this.requester = new cote.Requester({ name: 'Orchestrator Requester' });
        this.publisher = new cote.Publisher({
            name: 'Orchestrator Publisher',
            broadcasts: ['task'],
        });
    }

    publishEvent({ eventName, val}) {
        log(`EVENT ${eventName} PUBLISHED`)

        this.publisher.publish(eventName, val);
    }

    sendEvent({ type, value }, callback) {
        log(`EVENT ${type} SENDED`)

        this.requester.send({ type, value }, response => {
          callback(response);
        });
    }
}

class Orchestrator {
    constructor() {
        this.eventController = new EventController();
        this.connectedWorkers = [];
        this.masterUuid;
        this._startTochekIfAliveWorkers();
    }

    sendTask() {
        this.eventController.publishEvent({ eventName: 'task', val: JSON.stringify(exampleTask) })
    }

    startSendingTasks() {
        setInterval(this.sendTask.bind(this), 10000)
    }

    _startTochekIfAliveWorkers() {
        const checkIfAlive = () => this.eventController.sendEvent({ type: 'checkIfAlive' }, res => {
            res.role == "master" ? this._saveMasterUuid(res.uuid) : this._saveWorkerUuid(res.uuid);
        });
        setInterval(checkIfAlive, 1000)
    }

    _saveWorkerUuid(uuid){
        this.connectedWorkers.push(uuid);
    }
    _saveMasterUuid(uuid) {
        this.masterUuid = uuid;
    }
    
}

const orchestrator = new Orchestrator();

orchestrator.startSendingTasks();
