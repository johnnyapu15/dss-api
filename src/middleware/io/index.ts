/* eslint-disable no-multi-spaces */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
export * as socket from './init';

export enum SocketEvent {
    INIT            = 'INIT',
    ATTACH          = 'ATTACH',
    DETACH          = 'DETACH',
    SIGNAL          = 'SIGNAL',
    PRESIGNAL       = 'PRESIGNAL',

    CREATE_NOTE     = 'CREATE_NOTE',
    UPDATE_NOTE     = 'UPDATE_NOTE',
    DELETE_NOTE     = 'DELETE_NOTE',
    RETRIEVE_NOTE   = 'RETRIEVE_NOTE',
    REFRESH_NOTE    = 'REFRESH_NOTE',

    UPDATE_MOVEMENT = 'UPDATE_MOVEMENT',
    RETRIEVE_MOVEMENT = 'RETRIEVE_MOVEMENT',
    REFRESH_MOVEMENT = 'REFRESH_MOVEMENT',

    RESPONSE        = 'RESPONSE',
}

export type WebRTCMessage = {
    socketEvent     : SocketEvent
    markerId        : string
    members?        : string[]
    sender          : string
    data?           : string
    receiver?       : string
}

export type NoteMessage = {
    socketEvent?     : SocketEvent
    markerId        : string
    userId          : string
    noteId          : string
    noteText        : string
    posX            : number
    posY            : number
    createDt?        : string
    updateDt?        : string
}

export type RefreshNote = {
    socketEvent     : SocketEvent
    markerId        : string
    type: 'create' | 'update' | 'delete'
    note: NoteMessage
}

export type NoteMessageArray = {
    socketEvent     : SocketEvent
    markerId        : string
    receiver        : string
    notes           : NoteMessage[]
}

/**
 * Movement messages
 */
export enum MovementStatus {
    STAND = 'STAND',
    MOVE = 'MOVE',
}

export type Vector3 = {
    x       : number
    y       : number
    z       : number
}
export type MovementMessage = {
    socketEvent?     : SocketEvent
    markerId        : string
    userId          : string
    currentPosition : Vector3
    moveVector      : Vector3
    timestamp       : number
    status          : MovementStatus
}

export type RefreshMovement = {
    socketEvent     : SocketEvent
    markerId        : string
    type: 'create' | 'update' | 'delete'
    movement: MovementMessage
}

export type MovementMessageArray = {
    socketEvent     : SocketEvent
    markerId        : string
    receiver        : string
    movements           : MovementMessage[]
}
