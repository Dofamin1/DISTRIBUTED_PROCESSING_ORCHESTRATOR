module.exports = class GraphBuilder {
  constructor(clusterSize) {
    this.clusterSize = clusterSize;
  }

  build(aliveNodes) {
    let nodes = {};
    aliveNodes.forEach((role, uuid) => {
      const prev = nodes[role] ? nodes[role] : [];
      prev.push(uuid);
      nodes[role] = prev;
    });
    let sortedNodes = Object.values(nodes)
      .sort((a, b) => a.length - b.length);
    let nodesConnections = [...sortedNodes[0].map(node => this._getNodeName(node))];
    for (let i = 1; i < sortedNodes.length; i++) {
      let newConnections = [];
      for (let connection of nodesConnections) {
        let result = [];
        for (const node of sortedNodes[i]) {
          result.push(`${connection} -> ${this._getNodeName(node)}`)
        }
        newConnections.push(...result);
      }
      nodesConnections = newConnections;
    }
    const cluster = `{
      ${[...Array(this.clusterSize).keys()]
      .map(val => "DB" + (val + 1))
      .join(", ")}
      }`;
    return `digraph D {
        ${cluster} -> ${sortedNodes[0].map(node => this._getNodeName(node)).join(',')}
        ${nodesConnections.join('\n')}
      }`;
  }

  _getNodeName(node) {
    return `"${node.substr(0, 6)
      .replace("-", "")}"`;
  }
};