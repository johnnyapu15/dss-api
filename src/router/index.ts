import {Router, json } from 'express';
import { errorMiddleware } from '../middleware/error';
import logger from '../middleware/logger/index';
import markerRouter from './room';

const router = Router();

router
    .use(logger)
    .use('/', markerRouter)
    .use(errorMiddleware)

export default router;