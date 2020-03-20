FROM node:13.1-alpine

RUN apk --update add --no-cache git

WORKDIR app

RUN git clone https://github.com/Dofamin1/DISTRIBUTED_PROCESSING_ORCHESTRATOR.git \
    && cd DISTRIBUTED_PROCESSING_ORCHESTRATOR \
    && git checkout feat/remove_cote

WORKDIR DISTRIBUTED_PROCESSING_ORCHESTRATOR

RUN npm install
ENTRYPOINT npm run start
