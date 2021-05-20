/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
export * as socket from './init';

export enum SocketEvent {
    INIT = 'INIT',
    ATTACH = 'ATTACH',
    DETACH = 'DETACH',
    SIGNAL_PUSH = 'SIGNAL_PUSH',
    SIGNAL_POP = 'SIGNAL_POP',
}

export type SocketMessage = {
    socketEvent: SocketEvent
    markerId: string
    members?: string[]
    data?: string
    sender: string
    receiver?: string
}
