/* eslint-disable no-unused-vars */
/* eslint-disable prefer-rest-params */
import socketIO from 'socket.io';
import { createAdapter, RedisAdapter } from '@socket.io/redis-adapter';
import httpServer from 'http';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import RedisCache from '../memstore/redisCache';
import {
  WebRTCMessage,
  SocketEvent,
  NoteMessage,
  NoteMessageArray,
  RefreshNote,
  MovementMessage,
  MovementMessageArray,
  RefreshMovement,
} from '.';
import { allocID, generateRoomId as generateUnicastRoomId } from './commonFunctions';
import {
  onAttach, onCreateNote, onDeleteNote, onDetach,
  onDisconnect, onError, onPreSignal, onPushSignal,
  onUpdateMovement,
  onUpdateNote, retrieveMovement, retrieveNote,
} from './eventHandlers';
import cache from '../memstore';
import World from '../world/world';

let io: socketIO.Server;
export const world = new World();

export const localSockets: { [socketId: string]: socketIO.RemoteSocket<DefaultEventsMap> } = {};
export interface SocketMetadata {
  id: string
  markerId: string
  namespace: socketIO.Namespace
  socketId: string
}

async function fetchSockets(namespace: socketIO.Namespace) {
  // redis를 통해 모든 서버 인스턴스의 소켓들을 fetch
  const sockets = await namespace.fetchSockets();
  sockets.forEach((v) => {
    console.log(`[ID] ${v.id}`);
    localSockets[v.id] = v;
  });
}

export async function broadcast(
  metadata: SocketMetadata,
  msg:
    WebRTCMessage
    | NoteMessage
    | NoteMessageArray
    | RefreshNote
    | MovementMessage
    | MovementMessageArray
    | RefreshMovement,
) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  if (msg.socketEvent) {
    metadata.namespace
      .emit(msg.socketEvent, msg);
  }
}

export async function broadcastIncludeMe(
  metadata: SocketMetadata,
  msg:
    WebRTCMessage
    | NoteMessage
    | NoteMessageArray
    | RefreshNote
    | MovementMessage
    | MovementMessageArray
    | RefreshMovement,
) {
  // 이 서버에 연결된 소켓에 해당하는 멤버에게 브로드캐스트
  // console.log(`[${msg.socketEvent}] all broadcast ${msg}`);
  if (msg.socketEvent) {
    io.of(`${metadata.namespace.name}`)
      .emit(msg.socketEvent, msg);
  }
}

export async function unicast(
  metadata: SocketMetadata,
  msg: WebRTCMessage
    | NoteMessageArray
    | MovementMessageArray,
) {
  // 해당 소켓 멤버에 유니캐스트
  const { receiver } = msg;
  const receiverSocketId = await cache.get(receiver ?? '');
  if (receiverSocketId) {
    const nsp = metadata.namespace;
    const roomId = generateUnicastRoomId(metadata.socketId, receiverSocketId);
    const thisSocket = nsp.sockets.get(metadata.socketId);
    try {
      if (thisSocket) {
        if (receiverSocketId === metadata.socketId) {
          // 자기자신일 경우 그냥 송신
          thisSocket.emit(msg.socketEvent, msg);
        } else {
          // 1:1 room 생성후 join & 송신
          const { rooms } = thisSocket;
          if (!rooms?.has(roomId)) {
            await thisSocket.join(roomId);
            const adapter = nsp.adapter as RedisAdapter;
            await adapter.remoteJoin(receiverSocketId, roomId);
          }
          thisSocket.to(roomId).emit(msg.socketEvent, msg);
        }
        console.log(`[${msg.socketEvent}] unicast ${metadata.socketId} to ${receiver}(${receiverSocketId}), msg: ${JSON.stringify(msg)}`);
      } else {
        console.log('NO SOCKET');
      }
    } catch (e) {
      console.log(e);
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
      // Movement 이벤트
      .on(SocketEvent.UPDATE_MOVEMENT, onUpdateMovement.bind(metadata))
      .on(SocketEvent.RETRIEVE_MOVEMENT, retrieveMovement.bind(metadata))
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
