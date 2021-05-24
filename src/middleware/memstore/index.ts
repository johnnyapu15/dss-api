/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Request, Response, NextFunction } from 'express';
import { SocketMessage } from '../io';
import { allocID } from '../io/commonFunctions';
import { popFromArray, pushIntoArray } from './inMemoryAdaptor';

export * as cache from './inMemoryAdaptor';

export enum PUBSUBMessageType {
    BROADCAST = '',
    UNICAST = '',

}

export type PUBSUBMessage = {
    type?: PUBSUBMessageType
    message: SocketMessage
}

// HTTP middelwares
export async function pushMW(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.memberAddr;
    const data = req.body as string;

    pushIntoArray(id, data);

    res.statusCode = 200;
    res.end();
  } catch (e) {
    next(e);
  }
}

export async function popMW(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.memberAddr;
    const got = await popFromArray(id);
    res.statusCode = 200;
    res.end(got);
  } catch (e) {
    next(e);
  }
}

export async function generateIDMW(req: Request, res: Response, next: NextFunction) {
  try {
    const id = allocID();
    res.json({ id });
  } catch (e) {
    next(e);
  }
}
// end HTTP middelwares
