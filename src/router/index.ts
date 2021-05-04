import {Router, json } from 'express';
import { errorMiddleware } from '../middleware/error';
import logger from '../middleware/logger/index';
import auth_router from './auth';
import room_router from './room';

const router = Router();

router
    .use(logger)
    .use('/auth', auth_router)
    .use('/room', room_router)
    .use(errorMiddleware)

export default router;