module.exports = class MonitoringService {
  constructor(orchestrator, server, graphBuilder, dbClient, interval = 5000) {
    this.orchestrator = orchestrator;
    this.graphBuilder = graphBuilder;
    this.dbClient = dbClient;
    this.server = server;
    this.interval = interval;
  }

  monitoring() {
    setInterval(async () => {
      const graph = this.graphBuilder.build(this.orchestrator.aliveNodes);
      const len = await this.dbClient.queueLen();
      this.server.sendEvent('nodes_graph', graph);
      this.server.sendEvent('queue_length', len);
    }, this.interval);
  }
};