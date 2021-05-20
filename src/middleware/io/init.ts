/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO, { Socket } from 'socket.io';
import httpServer from 'http';
import { SocketMessage, SocketEvent } from '.';
import {
  allocID,
} from '../memstore/auth';

import { generateUUID, getMemberAddr } from '../memstore/commonFunctions';
import { redis } from '../memstore';
import { popFromArray, pushIntoArray } from '../memstore/cache';

// Generate UUID of the socket server instance
const instanceUUID = generateUUID().slice(0, 10);
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



async function attach(socket: socketIO.Socket, markerId: string, id: string) {
  try {
    // join
    // local socket join
    socket.join(markerId);
    localSockets[id] = socket;
    // subscribe to the marker
    const message = await redis.init(markerId, id);
    broadcast(message);
  } catch (e) {
    sendError(id, e);
  }
}

async function OnAttach(msg: SocketMessage) {
  try {
    // join
    // local socket join
    const { markerId, sender } = msg;
    socket.join(markerId);
    localSockets[sender] = socket;
    // subscribe to the marker
    const message = await redis.init(markerId, sender);
    broadcast(message);
  } catch (e) {
    sendError(sender, e);
  }
}

async function onDetach(msg: SocketMessage) {
  try {
    const { sender, markerId } = msg;
    if (!sender || !markerId) {
      throw new Error('Invalid parameter');
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

async function onPushSignal(msg: SocketMessage) {
  try {
    if (msg.sender && msg.receiver) {
      const sendTo = getMemberAddr(msg);
      await pushIntoArray(sendTo, msg.data);
      const receiver = localSockets[msg.receiver];
      const returnMsg = msg;
      returnMsg.socketEvent = SocketEvent.SIGNAL_POP;
      receiver.emit(SocketEvent.SIGNAL_POP, returnMsg);
    } else {
      console.log('invalid msg?');
    }
  } catch (e) {
    console.log(e);
  }
}

async function onPopSignal(this: Socket, msg: SocketMessage) {
  try {
    const parsed = msg
    if (parsed.sender) {
      const sendTo = getMemberAddr(msg);
      const got = await popFromArray(sendTo);
      this.emit(SocketEvent.SIGNAL_POP, got);
    }
  } catch (e) {
    console.log(e);
  }
}

export function initWS(server: httpServer.Server) {
  io = new socketIO.Server(server, { transports: ['websocket'] });

  io.on('connection', async (socket) => {
    console.log('INIT START');
    const markerIdGot = socket.handshake.query.markerId as string;
    const markerId = !markerIdGot ? 'anonymous-room' : markerIdGot;
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    const id = await allocID(userId);

    socket
      .on(SocketEvent.ATTACH, onAttach)
      .on(SocketEvent.DETACH, onDetach)
      .on(SocketEvent.SIGNAL_PUSH, onPushSignal)
      //.on(SocketEvent.SIGNAL_POP, onPopSignal.bind(socket))
      .on('disconnect', async (stat) => {
        console.log(`disconnected.`);
      })
      .on('error', (e) => {
        console.log(e);
        socket.emit('error', e);
      })
      .emit(SocketEvent.INIT, {
        socketEvent: SocketEvent.INIT,
        markerId,
        sender: id,
      } as SocketMessage);

    await attach(socket, markerId, id);

    console.log(`init ${id} on ${markerId}`);
  });
  console.log(`socket init for ${io.path()}`);
}

/// /////////////////////////
