import { Router, json } from 'express';

const markerRouter = Router();

markerRouter.use(json({ limit: '10mb', type: () => true }));

export default markerRouter;
