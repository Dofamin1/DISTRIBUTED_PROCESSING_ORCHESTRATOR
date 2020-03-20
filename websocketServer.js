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
    this.connections = [];
    this.events = new Map();
    this.server.on('connection', (connection) => {
      log(`Accept connection`, levels.INFO);

      this.connections.push(connection);
      connection.on('message', (msg) => {
        const jsonMsg = JSON.parse(msg);
        const callback = this.events.get(jsonMsg.event);
        if (callback) {
          const result = callback(jsonMsg);
          connection.send(JSON.stringify({
            event: jsonMsg.event,
            result
          }));
        }
      });
    });
  }

  addListenEvent(event, callback) {
    this.events.set(event, callback);
  }

  sendEvent(event, data) {
    this.connections.forEach(connection => {
      connection.send(JSON.stringify({event, data}))
    })
  }
}

module.exports = WebSocketServer;