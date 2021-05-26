/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Request, Response, NextFunction } from 'express';
import { WebRTCMessage } from '../io';
import { allocID } from '../io/commonFunctions';
import InMemoryCache from './inMemoryCache';

export const cache = new InMemoryCache();

export enum PUBSUBMessageType {
    BROADCAST = '',
    UNICAST = '',

}

export type PUBSUBMessage = {
    type?: PUBSUBMessageType
    message: WebRTCMessage
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
