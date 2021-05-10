export type WSMsg = {
    type: WSMsgType
    markerId: string
    members?: string[]
    data?: string
    id?: string
}

export enum WSMsgType {
    INIT = 'init',
    ATTACH = 'attach',
    DETACH = 'detach',
    SIGNAL = 'signal',
}

export enum SocketIOMsgEvent {
    ATTACH = 'attach',
    DETACH = 'detach',
}

export type Marker = {
    id: string
    name: string
}

export type SocketIOMsg = Marker