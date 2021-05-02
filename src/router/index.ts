import {Router, json } from 'express';
import logger from '../middleware/logger/index';
import memstore from '../middleware/memstore/index';
const router = Router();

router.use(logger);

router.get('/uuid', 
    memstore.getUUID
);

router.use(json({limit:'10mb', type: ()=> true}))

router.get('/data/:id', )


export default router;