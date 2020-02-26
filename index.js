const cote = require("cote");
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

        console.log('publish event')
        this.publisher.publish(eventName, val);
    }
}

class Orchestrator {
    constructor() {
        this.eventController = new EventController();
    }

    sendTask() {
        this.eventController.publishEvent({ eventName: 'task', val: JSON.stringify(exampleTask) })
    }

    strartTaskSending() {
        setInterval(this.sendTask.bind(this), 10000)
    }
}

const orchestrator = new Orchestrator();

orchestrator.strartTaskSending();
