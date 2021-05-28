/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO from 'socket.io';
import httpServer from 'http';
import {
  WebRTCMessage, SocketEvent, NoteMessage, NoteMessageArray,
} from '.';
import { allocID } from './commonFunctions';
import {
  onAttach, onCreateNote, onDeleteNote, onDetach, onDisconnect, onError, onPreSignal, onPushSignal, onUpdateNote,
} from './eventHandlers';

let io: socketIO.Server;
export const localSockets: { [socketId: string]: socketIO.Socket } = {};

export interface SocketMetadata {
  id: string
  markerId: string
}

export function broadcast(msg: WebRTCMessage | NoteMessage | NoteMessageArray) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  io
    .of(msg.markerId)
    .emit(msg.socketEvent, msg);
}

export function unicast(msg: WebRTCMessage) {
  // 이 서버에 연결된 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  if (receiver && localSockets[receiver]) {
    localSockets[receiver].emit(msg.socketEvent, msg);
  }
}

export function initWS(server: httpServer.Server) {
  io = new socketIO.Server(server, { transports: ['websocket'], path: '/' });
  io.of(/^\/\w*/).on('connection', async (socket) => {
    const namespace = socket.nsp;
    console.log('INIT START');
    const markerIdGot = namespace.name as string;
    const markerId = !markerIdGot ? '/anonymous-room' : markerIdGot;
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    const id = await allocID(userId);

    const metadata = { id, markerId } as SocketMetadata;

    socket
      .on(SocketEvent.ATTACH, onAttach)
      .on(SocketEvent.DETACH, onDetach)
      .on(SocketEvent.SIGNAL, onPushSignal)
      .on(SocketEvent.PRESIGNAL, onPreSignal)
      .on(SocketEvent.CREATE_NOTE, onCreateNote)
      .on(SocketEvent.UPDATE_NOTE, onUpdateNote)
      .on(SocketEvent.DELETE_NOTE, onDeleteNote)
      .on('disconnect', onDisconnect.bind(metadata))
      .on('error', onError.bind(metadata))
      .emit(SocketEvent.INIT, {
        socketEvent: SocketEvent.INIT,
        markerId,
        sender: id,
      } as WebRTCMessage);

    localSockets[id] = socket;

    console.log(`init ${id} on ${markerId}`);
  });
  console.log('socket init');
}
