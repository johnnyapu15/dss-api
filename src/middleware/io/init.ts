/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter'
import httpServer from 'http';
import RedisCache from '../memstore/redisCache';
import {
  WebRTCMessage, SocketEvent, NoteMessage, NoteMessageArray, RefreshNote,
} from '.';
import { allocID, getMarkerId } from './commonFunctions';
import {
  onAttach, onCreateNote, onDeleteNote, onDetach,
  onDisconnect, onError, onPreSignal, onPushSignal,
  onUpdateNote, retrieveNote,
} from './eventHandlers';

let io: socketIO.Server;

export const localSockets: { [socketId: string]: socketIO.Socket } = {};
export interface SocketMetadata {
  id: string
  markerId: string
  io: socketIO.Server
}

export function broadcast(msg: WebRTCMessage | NoteMessage | NoteMessageArray | RefreshNote) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  if (msg.socketEvent) {
    io
      .of(getMarkerId(msg))
      .emit(msg.socketEvent, msg);
  }
}

export async function unicast(msg: WebRTCMessage | NoteMessageArray) {
  // 이 서버에 연결된 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  
  if (receiver && localSockets[receiver]) {
    const socket = io.sockets.sockets.get(receiver)
    if (socket) {
      socket.emit(msg.socketEvent, msg);
    }
  }
}

export function initWS(server: httpServer.Server) {
  /**
   * 인자로 받은 서버 소켓에 SocketIO를 적용
   * markerId가 비어있으면 anonymous-room으로 생성
   */

  io = new socketIO.Server(server, { transports: ['websocket'], path: '/' });
  // redis adapter
  const redis = new RedisCache();
  const pubClient = redis.getClient();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  
  io.of(/^\/\w*/).on('connection', async (socket) => {
    const namespace = socket.nsp;
    console.log('[INIT] starting ...');
    const markerIdGot = namespace.name as string;
    const markerId = !markerIdGot ? '/anonymous-room' : markerIdGot;
    const unslashedMarkerId = markerId.startsWith('/') ? markerId.substring(1) : markerId;
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    const id = await allocID(userId);

    const metadata = {
      id,
      markerId: unslashedMarkerId,
      io,
    } as SocketMetadata;

    socket
      // marker 출입 이벤트
      .on(SocketEvent.ATTACH, onAttach.bind(metadata))
      .on(SocketEvent.DETACH, onDetach.bind(metadata))
      // WebRTC signal 이벤트
      .on(SocketEvent.SIGNAL, onPushSignal)
      .on(SocketEvent.PRESIGNAL, onPreSignal)
      // Note 이벤트
      .on(SocketEvent.CREATE_NOTE, onCreateNote)
      .on(SocketEvent.UPDATE_NOTE, onUpdateNote)
      .on(SocketEvent.DELETE_NOTE, onDeleteNote)
      .on(SocketEvent.RETRIEVE_NOTE, retrieveNote.bind(metadata))
      // SocketIO 기본 이벤트
      .on('disconnect', onDisconnect.bind(metadata))
      .on('error', onError.bind(metadata))
      .emit(SocketEvent.INIT, {
        socketEvent: SocketEvent.INIT,
        markerId: unslashedMarkerId,
        sender: id,
      } as WebRTCMessage);
    // 서버 인스턴스에 해당 소켓을 별도로 저장 / 관리
    localSockets[id] = socket;

    console.log(`init for ID: ${id} in MARKER: ${unslashedMarkerId}`);
  });
  console.log('[INIT] done.');
}
