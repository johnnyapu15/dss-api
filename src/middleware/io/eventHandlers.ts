/* eslint-disable no-unused-vars */
import {
  MovementMessage,
  MovementMessageArray,
  NoteMessage, NoteMessageArray, RefreshNote, SocketEvent, WebRTCMessage,
} from '.';
import cache from '../memstore';
import {
  getMarkerId, getMovementId, getMovementPattern, getNoteId, getNotePattern,
} from './commonFunctions';
import {
  broadcast, localSockets, SocketMetadata, unicast,
} from './init';

export function sendError(id: string, e: Error) {
  const socket = localSockets[id];
  console.error(`Error for ${e.message}`);
  console.info(e);
  socket.emit('error', e);
}

export function onError(this: SocketMetadata, e: Error) {
  sendError(this.id, e);
}

export async function onAttach(this: SocketMetadata, msg: WebRTCMessage) {
  let sender;
  console.log(`[ON ATTACH] sender: ${msg.sender} => marker: ${msg.markerId}`);
  try {
    const markerId = getMarkerId(msg);
    sender = msg.sender;

    // subscribe to the marker
    const setData = await cache.addIntoSet(sender, markerId);
    // redis에 유저의 id를 socketId로 기록
    await cache.set(this.id, this.socketId);
    const message = {
      socketEvent: SocketEvent.ATTACH,
      members: [...setData],
      markerId,
      sender,
    } as WebRTCMessage;

    broadcast(this, message);
  } catch (e) {
    if (sender) {
      sendError(sender, e);
    }
  }
}

export async function detach(metadata: SocketMetadata, sender: string, markerId: string) {
  // const sockets = await metadata.namespace.allSockets()
  await cache.deleteKey(sender);
  cache.del(sender);
  const setData = await cache.deleteFromSet(sender, markerId);
  const message = {
    socketEvent: SocketEvent.DETACH,
    members: [...setData],
    markerId,
    sender,
  } as WebRTCMessage;

  broadcast(metadata, message);
  console.log(`[DETACH] detached ${sender} from ${markerId}`);
}

export async function onDetach(this: SocketMetadata, msg: WebRTCMessage) {
  try {
    console.log(`[ON DETACH] ${msg.sender} from ${msg.markerId}`);
    const { sender } = msg;
    const markerId = getMarkerId(msg);
    if (!sender || !markerId) {
      throw new Error(`Invalid parameter ${msg}`);
    }

    await detach(this, sender, markerId);
  } catch (e) {
    if (msg.sender) {
      sendError(msg.sender, e);
    }
  }
}

export async function onDisconnect(this: SocketMetadata, reason: string) {
  detach(this, this.id, this.markerId);
  console.log(`[ON DISCONNECT] disconnected with reason: ${reason}`);
}

export async function onPushSignal(this: SocketMetadata, msg: WebRTCMessage) {
  try {
    console.log(`[SIGNAL] signal = ${JSON.stringify(msg)}`);
    if (msg.sender && msg.receiver) {
      const returnMsg = msg;
      returnMsg.socketEvent = SocketEvent.SIGNAL;
      unicast(this, returnMsg);
    } else {
      console.log('invalid msg?');
    }
  } catch (e) {
    console.log(e);
  }
}

export async function onPreSignal(this: SocketMetadata, msg: WebRTCMessage) {
  try {
    console.log(`[PRESIGNAL] presignal ${JSON.stringify(msg)}`);
    unicast(this, msg);
  } catch (e) {
    console.log(e);
  }
}

/** Note 단위로 수정/삭제/생성 -> 추후, redis의 hash를 이용해 필드 단위로 접근하도록 변경할 수 있음. */
export async function refreshNote(metadata: SocketMetadata, msg: RefreshNote) {
  broadcast(metadata, msg);
}

export async function onCreateNote(this: SocketMetadata, msg: NoteMessage) {
  const data = msg;
  data.socketEvent = undefined;
  const markerId = getMarkerId(data);
  data.markerId = markerId;
  if (!data.createDt) {
    data.createDt = new Date().toISOString();
  }
  const id = getNoteId(data);

  cache.set(id, JSON.stringify(data));

  const refresh = {
    markerId,
    socketEvent: SocketEvent.REFRESH_NOTE,
    note: data,
    type: 'create',
  } as RefreshNote;
  refreshNote(this, refresh);
}

export async function onUpdateNote(this: SocketMetadata, msg: NoteMessage) {
  const data = msg;
  data.socketEvent = undefined;
  const markerId = getMarkerId(data);
  data.markerId = markerId;
  if (!data.updateDt) {
    data.updateDt = new Date().toISOString();
  }
  const id = getNoteId(data);
  const got = await cache.get(id);
  if (got != null) {
    const prevObject = JSON.parse(got) as NoteMessage;
    if (prevObject.userId !== data.userId) {
      // 생성자가 아니라면 무시
      return;
    }
    const updatedObject = { ...prevObject, ...data };
    cache.set(id, JSON.stringify(updatedObject));
    const refresh = {
      markerId,
      socketEvent: SocketEvent.REFRESH_NOTE,
      note: updatedObject,
      type: 'update',
    } as RefreshNote;
    refreshNote(this, refresh);
  }
}

export async function onDeleteNote(this: SocketMetadata, msg: NoteMessage) {
  const data = msg;
  data.socketEvent = undefined;
  const id = getNoteId(data);
  const got = await cache.get(id);
  if (got != null) {
    const prevObject = JSON.parse(got) as NoteMessage;
    if (prevObject.userId !== data.userId) {
      // 생성자가 아니라면 무시
      return;
    }
    cache.del(id);
    const markerId = getMarkerId(data);
    const refresh = {
      markerId,
      socketEvent: SocketEvent.REFRESH_NOTE,
      note: data,
      type: 'delete',
    } as RefreshNote;
    refreshNote(this, refresh);
  }
}

export async function retrieveNote(this: SocketMetadata) {
  const pattern = getNotePattern(this.markerId);
  const noteStrings = await cache.pget(pattern);
  const notes: NoteMessage[] = [];
  noteStrings.forEach((noteString) => {
    notes.push(JSON.parse(noteString));
  });
  const ret: NoteMessageArray = {
    markerId: this.markerId,
    receiver: this.id,
    socketEvent: SocketEvent.RETRIEVE_NOTE,
    notes,
  };
  unicast(this, ret);
}

/**
 * Avatar movement
 */

export async function onUpdateMovement(this: SocketMetadata, msg: MovementMessage) {
  const data = msg;
  if (this.id !== data.userId) {
    // 생성자가 아니라면 무시
    return;
  }
  data.socketEvent = SocketEvent.REFRESH_MOVEMENT;
  const markerId = getMarkerId(data);
  data.markerId = markerId;
  data.timestamp = Date.now();

  const id = getMovementId(data);

  // store (No await.)
  cache.set(id, JSON.stringify(data));
  // broadcast
  broadcast(this, data);
}

export async function retrieveMovement(this: SocketMetadata) {
  const pattern = getMovementPattern(this.markerId);
  const movementStrings = await cache.pget(pattern);
  const movements: MovementMessage[] = [];
  movementStrings.forEach((movementString) => {
    movements.push(JSON.parse(movementString));
  });
  const ret: MovementMessageArray = {
    markerId: this.markerId,
    receiver: this.id,
    socketEvent: SocketEvent.RETRIEVE_MOVEMENT,
    movements,
  };
  unicast(this, ret);
}
