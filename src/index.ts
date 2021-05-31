import express from 'express';
import httpServer from 'http';
import { socket } from './middleware/io';
import router from './router/index';

const app = express();
app.use('/public', express.static('public'));
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const httpPort = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 3002;
const server = new httpServer.Server(app);
socket.initWS(server);

app.use('/', router);
app.listen(httpPort, '0.0.0.0')
server.listen(
  port, '0.0.0.0', undefined,
  () => {
    console.log(`listening to port ${port}`);
  },
);
