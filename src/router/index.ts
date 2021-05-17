import { Router } from 'express';
import { errorMiddleware } from '../middleware/error';
import logger from '../middleware/logger/index';
import markerRouter from './room';

const router = Router();

router
  .use(logger)
  .use('/marker', markerRouter)
  .use(errorMiddleware);

export default router;
