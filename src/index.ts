import express from 'express';
import httpServer from 'http';
import { socket } from './middleware/io';
import router from './router/index';

const app = express();
app.use('/public', express.static('public'));
let port = process.env.PORT ?? 3000;
if (typeof (port) === 'string') {
  port = parseInt(port, 10);
}
const server = new httpServer.Server(app);
socket.initWS(server);

app.use('/', router);
app.listen(3001, '0.0.0.0')
server.listen(
  port, '0.0.0.0', undefined,
  () => {
    console.log(`listening to port ${port}`);
  },
);
