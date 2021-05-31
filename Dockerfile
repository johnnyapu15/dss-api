FROM node:15

ENV PORT=3000

ENV REDIS_HOST='127.0.0.1'
ENV REDIS_AUTH='!dlatl00'
ENV REDIS_PORT=6379


WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]