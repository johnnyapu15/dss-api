import { Router, json } from 'express';
import { popMW, pushMW } from '../middleware/memstore';

const markerRouter = Router();

markerRouter.use(json({ limit: '10mb', type: () => true }));

markerRouter
  .get('/:memberAddr', popMW)
  .post('/:memberAddr', pushMW);

export default markerRouter;
