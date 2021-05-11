import { SocketMessage } from '../io';

export * as redis from './redis'
export * as cache from './cache';
export * as auth from './auth';


export enum PUBSUBMessageType {
    BROADCAST = '',
    UNICAST = '',

}

export type PUBSUBMessage = {
    type?: PUBSUBMessageType
    message: SocketMessage
}