const dockerCLI = require('docker-cli-js');
const {log} = require("../helpers");
const DEFAULT_OPTIONS = { machineName: null, currentWorkingDirectory: null, echo: false};

class DockerNodeRunner {
    constructor(imageName, docker) {
        this.docker = docker;
        this.imageName = imageName;
    }

    run({host, port, args, containerId}) {
        const command = `run --name ${containerId} -p ${port}:${port} ${this.imageName} ${args}`;
        log(`executing: ${command}`);
        return this.docker.command(command);
    }

    stop({ containerId }) {
        const stopCommand = `stop ${containerId}`;
        const rmCommand = `rm ${containerId}`;
        log(`executing: ${stopCommand}`);
        return this.docker.command(stopCommand)
            .then(() => {
                log(`executing ${rmCommand}`);
                return this.docker.command(rmCommand);
            });
    }
}

module.exports = function create(imageName, options = DEFAULT_OPTIONS) {
    const docker = new dockerCLI.Docker(options);
    const command = `pull ${imageName}`;
    log(`executing: ${command}`);
    return docker.command(command)
        .then(() => new DockerNodeRunner(imageName, docker));
};
