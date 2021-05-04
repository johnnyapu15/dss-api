import {Router, json } from 'express';


const room_router = Router();


room_router.use(json({limit:'10mb', type: ()=> true}))

room_router.get('/:room/:id', )



export default room_router;