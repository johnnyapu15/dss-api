import { Router } from 'express';
import { auth } from '../middleware/memstore';

const authRouter = Router();

authRouter.get('/uuid',
  auth.generateIDMW);

export default authRouter;
