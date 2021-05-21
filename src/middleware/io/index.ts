/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
export * as socket from './init';

export enum SocketEvent {
    INIT = 'INIT',
    ATTACH = 'ATTACH',
    DETACH = 'DETACH',
    SIGNAL = 'SIGNAL',
    PRESIGNAL = 'PRESIGNAL',
}

export type SocketMessage = {
    socketEvent: SocketEvent
    markerId: string
    members?: string[]
    sender: string
    data?: string
    receiver?: string
}
