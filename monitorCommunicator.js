class monitorCommunicator {
    constructor(wsServer) {
        this.wsServer = wsServer;
        this.context = null;
    }
    setContext(context) {
        this.context = context;
    }

    prepareGraphStruture() {
        let literal = 'digraph'
        const nodes = this.context.aliveNodes.values();
        const master = nodes.find(n => n.role == "master");
        const workers = nodes.filter(n => n.role == "worker");

        workers.forEach( (worker, i) => {
            if(i == 0) literal += '{'
            literal += `master_${master.uuid} -> worker_${worker.uuid}`
            if(i == workers.lengtj - 1) literal += '}'
        } )
        
        const graphData = {
            literal,
            nodes: {
                master,
                workers
            }
        }

        return graphData

    }

}