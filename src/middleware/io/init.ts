/* eslint-disable prefer-rest-params */
import socketIO from 'socket.io';
import httpServer from 'http';
import { SocketMessage, SocketEvent } from '.';
import {
  allocID,
} from '../memstore/auth';

import { generateUUID } from '../memstore/commonFunctions';
import { PUBSUBMessage, redis } from '../memstore';

// Generate UUID of the socket server instance
const instanceUUID = generateUUID().slice(0, 10);
let io: socketIO.Server;
const localSockets: { [socketId: string]: socketIO.Socket } = {};

function sendError(socket: socketIO.Socket, e: Error) {
  console.error(`Error for ${e.message}`);
  console.info(e);
  socket.emit('error', e.message);
}

async function attach(socket: socketIO.Socket, markerId: string, id: string) {
  try {
    // join
    // local socket join
    socket.join(markerId);
    localSockets[id] = socket;
    // subscribe to the marker
    const message = await redis.init(`marker_${markerId}`, id);

    redis.broadcast({
      message,
    } as PUBSUBMessage);
  } catch (e) {
    sendError(socket, e);
  }
}

async function detach(this: socketIO.Socket, msg: SocketMessage) {
  try {
    const { id, markerId } = msg;
    if (!id || !markerId) {
      throw new Error('Invalid parameter');
    }
    const message = await redis.close(id, markerId);

    redis.broadcast({
      message,
    } as PUBSUBMessage);
    console.log(`closed ${id} on ${markerId}`);
  } catch (e) {
    sendError(this, e);
  }
}

export function broadcast(msg: SocketMessage) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  io
    .to(msg.markerId)
    .emit(msg.socketEvent, msg);
}

export function unicast(msg: SocketMessage) {
  // 이 서버에 연결된 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  if (receiver && localSockets[receiver]) {
    localSockets[receiver].emit(msg.socketEvent, msg);
  }
}

export function initWS(server: httpServer.Server) {
  io = new socketIO.Server(server, { transports: ['websocket'] });

  io.on('connection', async (socket) => {
    const markerId = socket.handshake.query.markerId as string;
    if (!markerId) {
      // ERROR
      console.log('No markerId');
    }

    const id = await allocID(`${instanceUUID}_${socket.id}`);

    socket
      .on(SocketEvent.DETACH, detach.bind(socket, ...arguments))
      .on(SocketEvent.SIGNAL_PUSH, () => { })
      .on(SocketEvent.SIGNAL_POP, () => { })
      .on('error', (e) => {
        console.log(e);
        socket.emit('error', e);
      })
      .emit(SocketEvent.INIT, JSON.stringify({
        socketEvent: SocketEvent.INIT,
        markerId,
        id,
      } as SocketMessage));

    await attach(socket, markerId, id);

    console.log(`init ${id} on ${markerId}`);
  });
  console.log(`socket init for ${io.path()}`);
}

/// /////////////////////////
/*
async function signalHandler(msg: WebSocket.Data) {
  try {
    const parsed = JSON.parse(msg as string) as SocketMessage;
    if (parsed.id) {
      const sendTo = getMemberAddr(parsed.id, parsed.markerId);
      await pushSignal(sendTo, parsed.data);
      console.log(`${sendTo} => ${parsed.data}`);
    }
  } catch (e) {
    throw e;
  }
}
*/
