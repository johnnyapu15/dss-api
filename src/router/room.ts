import { Router, json } from 'express';
import { auth } from '../middleware/memstore/index';

const markerRouter = Router();

markerRouter.use(json({ limit: '10mb', type: () => true }));

markerRouter
  .get('/:memberAddr', auth.popMW)
  .post('/:memberAddr', auth.pushMW);

export default markerRouter;
