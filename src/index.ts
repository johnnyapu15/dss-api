import express from 'express';

import { initWS } from './middleware/io/init';
import router from './router/index';


const app = express();
const port = process.env.PORT ?? 3000;

initWS(app);

app.listen(
    port,
    () => {
        console.log(`listening to port ${port}.`);
    }
)


app.use('/', router);



