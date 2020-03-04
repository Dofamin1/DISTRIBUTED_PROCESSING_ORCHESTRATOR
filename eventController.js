const { log } = require("./helpers")
const cote = require("cote");

class EventController {
    constructor(eventsToBroadcast) {
        this.requester = new cote.Requester({ name: 'Orchestrator Requester' });
        this.publisher = new cote.Publisher({
            name: 'Orchestrator Publisher',
            broadcasts: eventsToBroadcast,
        });
    }

    publishEvent({ eventName, val}) {
        log(`EVENT ${eventName} PUBLISHED`);
        this.publisher.publish(eventName, val);
    }

    sendEvent({ type, value }, callback) {
        log(`EVENT ${type} SENDED`);

        this.requester.send({ type, value }, response => {
          callback(response);
        });
    }
}

module.exports = EventController;