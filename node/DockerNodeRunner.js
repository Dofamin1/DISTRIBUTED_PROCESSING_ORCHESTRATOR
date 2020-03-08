const dockerCLI = require("docker-cli-js");
const { log } = require("../helpers");
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

  try(command) {
    return new Promise(resolve => {
      command.then(() => resolve()).catch(() => resolve);
    });
  }

  run({ host, port, args, containerId }) {
    const command = `run --net="host" -d --name ${containerId} -p ${port}:${port} ${
      this.imageName
    } ${args}`;
    log(`executing: ${command}`);
    return this.docker.command(command);
  }

  stop({ containerId }) {
    const stopCommand = `stop ${containerId}`;

    log(`executing: ${stopCommand}`);
    return this.docker.command(stopCommand);
  }

  remove({ containerId }) {
    const rmCommand = `rm ${containerId}`;
    log(`executing ${rmCommand}`);
    return this.docker.command(rmCommand);
  }
}

function ofExceptionalPromise(promise) {
  return new Promise(resolve => {
    promise.then(() => resolve()).catch(() => resolve());
  });
}

module.exports = function create(imageName, options = DEFAULT_OPTIONS) {
  const docker = new dockerCLI.Docker(options);
  const command = `pull ${imageName}`;
  log(`executing: ${command}`);

  if (ENVIRONMENT == "docker") {
    return ofExceptionalPromise(docker.command(command)).then(
      () => new LocalDockerNodeRunner(imageName, docker)
    );
  } else if (ENVIRONMENT == "local") {
    return new Promise.resolve();
  }
};
