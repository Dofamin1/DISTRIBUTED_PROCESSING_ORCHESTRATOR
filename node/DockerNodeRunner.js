const dockerCLI = require('docker-cli-js');
const DEFAULT_OPTIONS = { machineName: null, currentWorkingDirectory: null, echo: false};

class DockerNodeRunner {
    constructor(repoUrl, imageName, options = DEFAULT_OPTIONS) {
        this.docker = new dockerCLI.Docker(options);
        this.repoUrl = repoUrl;
        this.imageName = imageName;
    }

    run(node) {
        return this.docker.command(`pull ${this.repoUrl}`)
            .then(this._runInstance)
    }

    _runInstance = () => this.docker.command(`run ${this.imageName}`);
}