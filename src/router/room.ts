import {Router, json } from 'express';
import { popMW } from '../middleware/memstore/cache';


const room_router = Router();


room_router.use(json({limit:'10mb', type: ()=> true}))

room_router.get('/:room/:id', 
    popMW
    )



export default room_router;