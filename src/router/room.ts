import { Router, json } from 'express';
import { popMW, pushMW } from '../middleware/memstore/auth';


const markerRouter = Router();


markerRouter.use(json({ limit: '10mb', type: () => true }))

markerRouter
    .get('/:memberAddr', popMW)
    .post('/:memberAddr', pushMW)



export default markerRouter;