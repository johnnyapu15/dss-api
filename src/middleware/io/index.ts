export enum SocketIOMsgEvent {
    ATTACH = 'attach',
    DETACH = 'detach',
}

export type Marker = {
    id: string
    name: string
}

export type SocketIOMsg = Marker