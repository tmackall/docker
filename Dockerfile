FROM resin/rpi-raspbian:jessie-20160831  
RUN apt-get update && \  
    apt-get -qy install curl \
                build-essential python \
                ca-certificates
WORKDIR /root/  
RUN curl -O \  
  https://nodejs.org/dist/v4.5.0/node-v4.5.0-linux-armv6l.tar.gz
RUN tar -xvf node-*.tar.gz -C /usr/local \  
  --strip-components=1

# Create app directory
RUN mkdir -p /srv/docker
WORKDIR /srv/docker

# Install app dependencies
COPY package.json /srv/docker
RUN npm install

# Bundle app source
COPY . /srv/docker

EXPOSE 3050
ENV LL=debug
CMD [ "npm", "start" ]
