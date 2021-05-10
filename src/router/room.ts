import { Router, json } from 'express';
import { popMW, popSignal, pushMW, pushSignal } from '../middleware/memstore/auth';


const room_router = Router();


room_router.use(json({ limit: '10mb', type: () => true }))

room_router
    .get('/:memberAddr', popMW)
    .post('/:memberAddr', pushMW)



export default room_router;