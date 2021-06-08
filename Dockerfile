FROM node:15

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install pm2 -g

COPY . .

EXPOSE ${PORT}

RUN npm run build

CMD [ "pm2-runtime", ".", "-i", "max", "&" ]