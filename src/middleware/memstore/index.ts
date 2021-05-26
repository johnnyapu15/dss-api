/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Request, Response, NextFunction } from 'express';
import { WebRTCMessage } from '../io';
import { allocID } from '../io/commonFunctions';
import InMemoryCache from './inMemoryCache';
import RedisCache from './redisCache';

export const cache = (() => {
  // REDIS_HOST 환경변수가 없으면 inmemory cache를 사용함.
  if (process.env.REDIS_HOST) {
    console.log('Using redis cache...');
    return new RedisCache();
  }
  console.log('Using in-memory cache...');
  return new InMemoryCache();
})();

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
