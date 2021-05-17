import { Router } from 'express';
import logger from '../middleware/logger/index';
import markerRouter from './room';

const router = Router();

router
  .use(logger)
  .use('/marker', markerRouter);

export default router;
