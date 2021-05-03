import {Router, json } from 'express';
import logger from '../middleware/logger/index';
import memstore from '../middleware/memstore/index';
import room_router from './room/index';

const router = Router();

router.use(logger);

router.get('/uuid', 
    memstore.getUUID
);

router.use('/room', room_router);



export default router;