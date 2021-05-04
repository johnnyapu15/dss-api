import {Router, json } from 'express';
import { auth } from '../middleware/memstore';


const auth_router = Router();


auth_router.get('/uuid', 
    auth.generateIDMW
);



export default auth_router;