import express from 'express';
import router from './router/index';


const app = express()

app.use('/', router);


const port = process.env.PORT ?? 3000;
app.listen(
    port,
    () => {
        console.log(`listening to port ${port}.`);
    }
)