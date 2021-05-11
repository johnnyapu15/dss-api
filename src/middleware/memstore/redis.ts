import { PUBSUBMessage, PUBSUBMessageType } from ".";
import redis from 'redis'
import { socket } from "../io";
import { attachIntoMarker, deleteSignalHolder, detachFromMarker } from "./auth";

async function pub(msg: PUBSUBMessage) {

}

export async function broadcast(msg: PUBSUBMessage) {
    if (!msg.type) {
        msg.type = PUBSUBMessageType.BROADCAST
    }
    /** MOCK */
    
    msghandler(msg)
}

export async function unicast(msg: PUBSUBMessage) {
    if (!msg.type) {
        msg.type = PUBSUBMessageType.UNICAST
    }
    /** MOCK */
    msghandler(msg)
}


export async function msghandler(msg: PUBSUBMessage) {
    /** use sub,  */
    switch (msg.type) {
        case PUBSUBMessageType.BROADCAST:
            socket.broadcast(msg.message)
            break;
        case PUBSUBMessageType.UNICAST:
            socket.unicast(msg.message)
            break
        default:
            break

    }

}


export async function init(markerId: string, id: string) {
    /** use sub */
    
    /** MOCK using local memory */
    return await attachIntoMarker(id, markerId)

    // marker

    // signal
    console.log('redis init')
}

export async function close(markerId: string, id: string) {
    /** use sub */

    /** MOCK using local memory */
    return await detachFromMarker(id, markerId)

    // marker

    // signal
}