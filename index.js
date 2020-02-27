const { log } = require("./helpers")
const EventController = require('./eventController')
const exampleTask = {
    command: 'do something'
}

class Orchestrator {
    constructor() {
        this.eventController = new EventController();
        this.connectedWorkers = [];
        this.eventsToBroadcast = ['task'];
        this.masterUuid;
        this._startTochekIfAliveWorkers();
    }

    sendTask(task) {
        this.eventController.publishEvent({ eventName: 'task', val: JSON.stringify(task) })
    }

    startSendingTasks() {
        const task = this._getTask()
        const sendTask = this.sendTask.bind(this)
        setInterval(() => sendTask(task), 10000)
    }

    _getTask() {
        return exampleTask //TODO: remove hardcode
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
