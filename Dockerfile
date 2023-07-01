FROM node:10-alpine

#ARG NODE_ENV=prod

RUN apk add --no-cache bash git python build-base

# Copy git source
COPY . /src
COPY env.example.sh /src/env.sh

# Build client assets
WORKDIR /src
RUN ./build.sh

# Build server assets
WORKDIR /src/server
RUN ./build.sh


WORKDIR /src/client
RUN ./build.sh

## Change to ssc
#WORKDIR /src/ssc
#RUN npm install

WORKDIR /src/server

EXPOSE 8010

CMD ["bash", "/src/server/run.sh", "start"]
