export * as socket from './init'

export type SocketMessage = {
    event: SocketEvent
    markerId: string
    members?: string[]
    data?: string
    id?: string
    sender?: string
    receiver?: string
}

export enum SocketEvent {
    INIT = 'init',
    ATTACH = 'attach',
    DETACH = 'detach',
    SIGNAL_PUSH = 'signal_push',
    SIGNAL_POP = 'signal_pop',
}