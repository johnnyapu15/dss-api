/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO, { Socket } from 'socket.io';
import httpServer from 'http';
import { SocketMessage, SocketEvent } from '.';
import {
  allocID,
} from '../memstore/auth';

import { getMemberAddr } from '../memstore/commonFunctions';
import { redis } from '../memstore';
import { pushIntoArray } from '../memstore/cache';

let io: socketIO.Server;
const localSockets: { [socketId: string]: socketIO.Socket } = {};

function sendError(id: string, e: Error) {
  const socket = localSockets[id];
  console.error(`Error for ${e.message}`);
  console.info(e);
  socket.emit('error', e.message);
}

export function broadcast(msg: SocketMessage) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  io
    .of(msg.markerId)
    .emit(msg.socketEvent, msg);
}

export function unicast(msg: SocketMessage) {
  // 이 서버에 연결된 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  if (receiver && localSockets[receiver]) {
    localSockets[receiver].emit(msg.socketEvent, msg);
  }
}

async function onAttach(msg: SocketMessage) {
  let sender;
  console.log(msg);
  try {
    // join
    // local socket join
    const { markerId } = msg;
    sender = msg.sender;

    // subscribe to the marker
    const message = await redis.init(markerId, sender);
    broadcast(message);
  } catch (e) {
    if (sender) {
      sendError(sender, e);
    }
  }
}

async function onDetach(msg: SocketMessage) {
  try {
    console.log(msg)
    const { sender, markerId } = msg;
    if (!sender || !markerId) {

      throw new Error(`Invalid parameter ${msg}`);
    }
    const message = await redis.close(markerId, sender);

    broadcast(message);
    console.log(`closed ${sender} on ${markerId}`);
  } catch (e) {
    if (msg.sender) {
      sendError(msg.sender, e);
    }
  }
}

async function detach(sender: string, markerId: string) {
  const message = await redis.close(markerId, sender);
  broadcast(message);
  console.log(`closed ${sender} on ${markerId}`);
}

async function onPushSignal(msg: SocketMessage) {
  try {
    console.log(`signal = ${msg}`)
    if (msg.sender && msg.receiver) {

      const sendTo = getMemberAddr(msg);
      await pushIntoArray(sendTo, msg.data);
      const returnMsg = msg;
      returnMsg.socketEvent = SocketEvent.SIGNAL;
      unicast(returnMsg);
    } else {
      console.log('invalid msg?');
    }
  } catch (e) {
    console.log(e);
  }
}

async function onPreSignal(msg: SocketMessage) {
  try {
    console.log('presignaling')
    unicast(msg);
  } catch (e) {
    console.log(e);
  }
}

// async function onPopSignal(this: Socket, msg: SocketMessage) {
//   try {
//     const parsed = msg
//     if (parsed.sender) {
//       const sendTo = getMemberAddr(msg);
//       const got = await popFromArray(sendTo);
//       this.emit(SocketEvent.SIGNAL_POP, got);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }

export function initWS(server: httpServer.Server) {
  io = new socketIO.Server(server, { transports: ['websocket'], path: '/' });
  io.of(/^\/\w*/).on('connection', async (socket) => {
    const namespace = socket.nsp;
    console.log('INIT START');
    const markerIdGot = namespace.name as string;
    const markerId = !markerIdGot ? '/anonymous-room' : markerIdGot;
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    const id = await allocID(userId);

    socket
      .on(SocketEvent.ATTACH, onAttach)
      .on(SocketEvent.DETACH, onDetach)
      .on(SocketEvent.SIGNAL, onPushSignal)
      .on(SocketEvent.PRESIGNAL, onPreSignal)
      .on('disconnect', async (stat) => {
        detach(id, markerId);
        console.log('disconnected.');
      })
      .on('error', (e) => {
        console.log('errrrr')
        socket.emit('error', e);
      })
      .emit(SocketEvent.INIT, {
        socketEvent: SocketEvent.INIT,
        markerId,
        sender: id,
      } as SocketMessage);

    localSockets[id] = socket;

    console.log(`init ${id} on ${markerId}`);
  });
  console.log('socket init');
}

/// /////////////////////////
