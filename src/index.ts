import express from 'express';
import httpServer from 'http';
import { socket } from './middleware/io';
import router from './router/index';

const app = express();
let port = process.env.PORT ?? 3000;
if (typeof (port) === 'string') {
  port = parseInt(port, 10);
}
const server = new httpServer.Server(app);
socket.initWS(server);

app.use('/', router);

server.listen(
  port, '0.0.0.0', undefined,
  () => {
    console.log(`listening to port ${port}`);
  },
);
