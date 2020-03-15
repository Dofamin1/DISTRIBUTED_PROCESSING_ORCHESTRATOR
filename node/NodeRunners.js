const dockerCLI = require("docker-cli-js");
const { log, levels } = require("../helpers");
const DEFAULT_OPTIONS = {
  machineName: null,
  currentWorkingDirectory: null,
  echo: false
};
const { ENVIRONMENT } = process.env;

class LocalDockerNodeRunner {
  constructor(imageName, docker) {
    this.docker = docker;
    this.imageName = imageName;
  }

  run({ host, port, args, nodeUUID }) {
    const command = `run --net="host" -d --name ${nodeUUID} ${this.imageName} ${args}`;
    log(`executing: ${command}`);
    return this.docker.command(command);
  }

  stop({ nodeUUID }) {
    const stopCommand = `stop ${nodeUUID}`;

    log(`executing: ${stopCommand}`);
    return this.docker.command(stopCommand);
  }

  remove({ nodeUUID }) {
    const rmCommand = `rm ${nodeUUID}`;
    log(`executing ${rmCommand}`);
    return this.docker.command(rmCommand);
  }
}

class LoggableNodeRunner {
  run({ args, nodeUUID }) {
    log(`Run node with UUID: ${nodeUUID}`, levels.DEBUG);
    return Promise.resolve();
  }

  stop({ nodeUUID }) {
    log(`Stop node with UUID: ${nodeUUID}`, levels.DEBUG);
    return Promise.resolve();
  }

  remove({ nodeUUID }) {
    log(`Remove node with UUID: ${nodeUUID}`, levels.DEBUG);
    return Promise.resolve();
  }
}

function ofExceptionalPromise(promise) {
  return new Promise(resolve => {
    promise.then(() => resolve()).catch(() => resolve());
  });
}

module.exports = class NodeRunners {
  static creteDockerRunner(imageName, options = DEFAULT_OPTIONS) {
    const docker = new dockerCLI.Docker(options);
    const command = `pull ${imageName}`;
    log(`executing: ${command}`);
    return ofExceptionalPromise(docker.command(command)).then(
        () => new LocalDockerNodeRunner(imageName, docker)
    );
  }

  static createLoggableRunner() {
    return Promise.resolve(new LoggableNodeRunner());
  }
};