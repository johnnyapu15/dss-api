import { Express } from 'express';
import { allocID, attachIntoMarker, deleteSignalHolder, detachFromMarker, pushSignal } from '../memstore/auth';
import { Marker, WSMsg, WSMsgType } from '.';
import WebSocket from 'ws'
import expressWs from 'express-ws';
import { getMemberAddr } from '../memstore/commonFunctions';

type LocalSocket = {
    socket: WebSocket
    id: string
    roomId: string
}
const localSockets: {
    [key: string]:
    Map<string, LocalSocket>
} = {}

export function initWS(app: Express) {
    const wsApp = expressWs(app).app

    wsApp
        .ws('/:roomId', async (socket, req, next) => {
            try {
                const roomId = req.params.roomId as string
                const id = await allocID()

                socket
                    .on('message', async (msg) => {
                        try {
                            await signalHandler(msg)
                        } catch (e) {
                            sendError(id, socket, e)
                        }
                    })
                    .on('close', async (code) => {
                        try {
                            if (code === 1005) {
                                await closeConnection(id, roomId)
                            }
                        } catch (e) {
                            sendError(id, socket, e)
                        }
                    })

                initConnection(socket, id, roomId)

            } catch (e) {
                next(e)
            }
        })

}

async function initConnection(socket: WebSocket, id: string, roomId: string) {

    if (!localSockets[roomId]) {
        localSockets[roomId] = new Map()
    }
    localSockets[roomId].set(id, {
        id,
        roomId,
        socket
    } as LocalSocket)

    socket.send(JSON.stringify({
        type: WSMsgType.INIT,
        markerId: roomId,
        id: id
    } as WSMsg))

    // Create room | join
    const roomData = await attachIntoMarker(id, roomId);
    const data = JSON.stringify(roomData)

    if (roomData.members) {
        broadcast(
            roomData.members,
            id,
            roomId,
            data
        )
    }

    console.log(`init ${id} on ${roomId}`)
}

async function closeConnection(id: string, roomId: string) {
    await deleteSignalHolder(id)
    const roomData = await detachFromMarker(id, roomId)
    const data = JSON.stringify(roomData)
    if (roomData.members) {
        broadcast(
            roomData.members,
            id,
            roomId,
            data
        )
    }
    console.log(`closed ${id} on ${roomId}`)
}

async function signalHandler(msg: WebSocket.Data) {
    try {
        const parsed = JSON.parse(msg as string) as WSMsg
        if (parsed.id) {
            const sendTo = getMemberAddr(parsed.id, parsed.markerId)
            await pushSignal(sendTo, parsed.data)
            console.log(`${sendTo} => ${parsed.data}`)
        }
    } catch (e) {
        throw e
    }
}

export async function broadcast(members: string[], id: string, roomId: string, data?: string) {
    // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
    const localMembers = localSockets[roomId]
    members.forEach(memberId => {
        // chk local members
        if (localMembers.has(memberId)) {
            localMembers.get(memberId)?.socket
                .send(data)
        }
    })
}


function sendError(id: string, socket: WebSocket, e: Error) {
    console.error(`Error for ${e.name}, socket: ${id}`)
    console.info(e)
    socket.send(e.name)
}