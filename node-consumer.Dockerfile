FROM node:22-alpine3.20

# Install node-rdkafka
RUN apk add --no-cache bash g++ make py3-pip python3 git unzip

WORKDIR /app
COPY rdkafka/package*.json /app
RUN npm i

COPY rdkafka /app

CMD ["npm", "start"]
