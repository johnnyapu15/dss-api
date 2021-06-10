/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO from 'socket.io';
import { createAdapter, RedisAdapter } from '@socket.io/redis-adapter'
import httpServer from 'http';
import RedisCache from '../memstore/redisCache';
import {
  WebRTCMessage, SocketEvent, NoteMessage, NoteMessageArray, RefreshNote,
} from '.';
import { allocID, generateRoomId } from './commonFunctions';
import {
  onAttach, onCreateNote, onDeleteNote, onDetach,
  onDisconnect, onError, onPreSignal, onPushSignal,
  onUpdateNote, retrieveNote,
} from './eventHandlers';
import { cache } from '../memstore';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

let io: socketIO.Server;

export const localSockets: { [socketId: string]: socketIO.RemoteSocket<DefaultEventsMap> } = {};
export interface SocketMetadata {
  id: string
  markerId: string
  namespace: socketIO.Namespace
  socketId: string
}

async function fetchSockets(namespace: socketIO.Namespace) {
  // redis를 통해 모든 서버 인스턴스의 소켓들을 fetch
  const sockets = await namespace.fetchSockets()
  sockets.forEach(v => {
    console.log(`[ID] ${v.id}`)
    localSockets[v.id] = v})
}

export async function broadcast(metadata: SocketMetadata, msg: WebRTCMessage | NoteMessage | NoteMessageArray | RefreshNote) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  console.log(`[${msg.socketEvent}] broadcast to socketIds: ${[...await metadata.namespace.allSockets()]}`)
  if (msg.socketEvent) {
    metadata.namespace
      .emit(msg.socketEvent, msg);
  }
}

export async function unicast(metadata: SocketMetadata, msg: WebRTCMessage | NoteMessageArray) {
  // 해당 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  const receiverSocketId = await cache.get(receiver ?? '')
  if (receiverSocketId) {
    // 둘의 unicast room 생성
    const nsp = metadata.namespace
    const roomId = generateRoomId(metadata.socketId, receiverSocketId)
    const thisSocket = nsp.sockets.get(metadata.socketId)
    if (thisSocket) {
      const rooms = thisSocket.rooms
      if (!rooms?.has(roomId)) {
        thisSocket.join(roomId)
        const adapter = nsp.adapter as RedisAdapter
        adapter.remoteJoin(receiverSocketId, roomId)
      }
      thisSocket.to(roomId).emit(msg.socketEvent, msg);
      console.log(`[${msg.socketEvent}] unicast to ${receiver}(${receiverSocketId})`)
    } else {
      console.log("NO SOCKET")
    }
    /*
    if (!localSockets[receiverSocketId]) {
      // 해당 서버 인스턴스에 목적지 소켓 정보가 없을 경우, redis를 통해 fetch
      await fetchSockets(metadata.namespace)
    }
    const socket = localSockets[receiverSocketId]
    if (socket) {
      socket.emit(msg.socketEvent, msg);
      console.log(`[${msg.socketEvent}] unicast to ${receiver}(${receiverSocketId})`)
    } else {
      console.log("NO SOCKET")
    }
    */
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
    const markerIdGot = namespace.name as string;
    const markerId = !markerIdGot ? '/anonymous-room' : markerIdGot;
    const unslashedMarkerId = markerId.startsWith('/') ? markerId.substring(1) : markerId;
    const userId = (socket.handshake.query.userId as string) ?? socket.id;
    const id = await allocID(userId);

    console.log(`[INIT] socket init for ${unslashedMarkerId}/${id} ... `);
    
    const metadata = {
      id,
      markerId: unslashedMarkerId,
      namespace,
      socketId: socket.id,
    } as SocketMetadata;

    socket
      // marker 출입 이벤트
      .on(SocketEvent.ATTACH, onAttach.bind(metadata))
      .on(SocketEvent.DETACH, onDetach.bind(metadata))
      // WebRTC signal 이벤트
      .on(SocketEvent.SIGNAL, onPushSignal.bind(metadata))
      .on(SocketEvent.PRESIGNAL, onPreSignal.bind(metadata))
      // Note 이벤트
      .on(SocketEvent.CREATE_NOTE, onCreateNote.bind(metadata))
      .on(SocketEvent.UPDATE_NOTE, onUpdateNote.bind(metadata))
      .on(SocketEvent.DELETE_NOTE, onDeleteNote.bind(metadata))
      .on(SocketEvent.RETRIEVE_NOTE, retrieveNote.bind(metadata))
      // SocketIO 기본 이벤트
      .on('disconnect', onDisconnect.bind(metadata))
      .on('error', onError.bind(metadata))
      .emit(SocketEvent.INIT, {
        socketEvent: SocketEvent.INIT,
        markerId: unslashedMarkerId,
        sender: id,
      } as WebRTCMessage);
    
    console.log(`socket initialized for ${unslashedMarkerId}/${id}.`);
  });
  console.log('[INIT] done.');
}
