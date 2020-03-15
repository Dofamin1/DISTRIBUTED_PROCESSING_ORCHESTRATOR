const WebSocket = require('ws');
const { log, levels } = require('./helpers');

function initServer(port) {
  return new WebSocket.Server({
    port: port,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed.
    }
  });
}

class WebSocketServer {
  constructor(port) {
    this.server = initServer(port);
    this.workerConnections = new Map();
    this.masterConnection = null;
    this.monitorConnection = null;
    this.events = new Map();
    this.server.on('connection', (connection) => {
      log(`Accept connection`, levels.INFO);

      connection.on('message', (msg) => {
        const jsonMsg = JSON.parse(msg);

        if(jsonMsg.event == 'status') this._saveConnectionByRole(jsonMsg.data, connection) //TODO: bad position for this if statment

        const callback = this.events.get(jsonMsg.event);
        if (callback) {
          callback(jsonMsg);
        }
      });
    });
  }

  addListenEvent(event, callback) {
    this.events.set(event, callback);
  }

  sendEvent({event, data}, connection) {
    const body = JSON.stringify({event, data});

    connection.send(body)
  }

  sendEventToMaster({event, data}) {
    this.sendEvent({event, data}, this.masterConnection);
  }
  sendEventToMonitor({event, data}) {
    this.sendEvent({event, data}, this.monitorConnection);
  }

  _saveConnectionByRole({role, uuid}, connection) {
    const handlers = {
      monitor: connection => this.monitorConnection = connection,
      master: connection => this.masterConnection = connection,
      worker: connection => this.workerConnections.push(connection)
    }
    const handler = handlers[role];
    handler(connection);
  }
}

module.exports = WebSocketServer;