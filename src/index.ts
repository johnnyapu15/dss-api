import express from 'express';
import http from 'http';

import { initSocketIO } from './middleware/io/init';
import router from './router/index';


const app = express();
const server = http.createServer(app);
const port = process.env.PORT ?? 3000;
server.listen(
    port,
    () => {
        console.log(`listening to port ${port}.`);
    }
)

initSocketIO(server);

app.use('/', router);



