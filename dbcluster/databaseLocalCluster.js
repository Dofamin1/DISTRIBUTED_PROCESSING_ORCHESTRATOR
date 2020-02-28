const dockerCLI = require('docker-cli-js');
const fs = require('fs');
const path = require('path');

class LocalDockerDbCluster {
    constructor(imageResolver, configDir, options) {
        this.configDir = configDir;
        this.options = options ? options : new dockerCLI.Options(null, null, false);
        this.docker = new dockerCLI.Docker(this.options);
        this.imageResolver = imageResolver;
        this.nodes = [];
    }

    withNode(node) {
        if (this.nodes.includes(node)) {
            throw new Error("Duplicate node");
        }
        this.nodes.push(node);
        return this;
    }

    // noinspection DuplicatedCode
    run() {
        if (!this.nodes.length) throw new Error("No hosts to run");
        return Promise.all(
            this.nodes.map(node => {
                // noinspection JSUnresolvedFunction,JSCheckFunctionSignatures
                return this.docker.command( `pull ${this.imageResolver.name}`)
                    .then(() => this._createConfigDirectories(this.configDir, node.port))
                    .then(nodeConfigDir => this._fillNodeConfigFile(nodeConfigDir, node))
                    .then(filename => this._doRun(filename, node))
            })
        )
            .then(() => this.imageResolver.resolveClient(this.nodes));
    }

    stop() {
        return Promise.all(
            this.nodes.map(node => {
                return this.docker.command(node, `stop image_${node.port}`)
            })
        );
    }

    _doRun = (filename, node) => this.docker.command(`run -p ${node.port}:${node.port}`
        .concat(` -p ${node.port + 10000}:${node.port + 10000} `)
        .concat(` -d -v ${filename}:${this.imageResolver.configFileName}`)
        .concat(` --name image_${node.port}`)
        .concat(` ${this.imageResolver.name} ${this.imageResolver.secondName} ${this.imageResolver.configFileName} `));

    _fillNodeConfigFile = (dir, node) => {
        return new Promise((resolve, reject) => {
            const filePath = path.resolve(dir, "redis.conf");
            fs.writeFile(filePath, this.imageResolver.resolveConfigData(node.port), err => {
                if (err) reject(err);
                else resolve(filePath);
            });
        });
    };

    _createConfigDirectories = (dir, port) => {
        return new Promise((resolve, reject) => {
            const resolvedDir = path.resolve(dir, port.toString());
            if (!fs.existsSync(resolvedDir)) {
                fs.mkdir(resolvedDir, err => {
                    if (err) reject(err);
                    else resolve(resolvedDir);
                });
            } else {
                resolve(resolvedDir);
            }
        });
    };
}

module.exports = LocalDockerDbCluster;