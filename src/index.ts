import express from 'express';
import httpServer from 'http'
import {socket} from './middleware/io';
import router from './router/index';


const app = express();
const port = process.env.PORT ?? 3000;
const server = new httpServer.Server(app)
socket.initWS(server);

app.use('/', router);

server.listen(
    port,
    () => {
        console.log(`listening to port ${port}`);
    }
)





