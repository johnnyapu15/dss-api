/* eslint-disable no-unused-vars */
import {
  NoteMessage, NoteMessageArray, SocketEvent, WebRTCMessage,
} from '.';
import { cache } from '../memstore';
import { getMemberAddr, getNoteId, getPattern } from './commonFunctions';
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

export async function onAttach(msg: WebRTCMessage) {
  let sender;
  console.log(msg);
  try {
    // join
    // local socket join
    const { markerId } = msg;
    sender = msg.sender;

    // subscribe to the marker
    const setData = await cache.addIntoSet(sender, markerId);
    const message = {
      socketEvent: SocketEvent.ATTACH,
      members: [...setData],
      markerId,
      sender,
    } as WebRTCMessage;

    broadcast(message);
  } catch (e) {
    if (sender) {
      sendError(sender, e);
    }
  }
}

export async function detach(sender: string, markerId: string) {
  await cache.deleteKey(sender);
  const setData = await cache.deleteFromSet(sender, markerId);
  const message = {
    socketEvent: SocketEvent.DETACH,
    members: [...setData],
    markerId,
    sender,
  } as WebRTCMessage;

  broadcast(message);
  console.log(`closed ${sender} on ${markerId}`);
}

export async function onDetach(msg: WebRTCMessage) {
  try {
    console.log(msg);
    const { sender, markerId } = msg;
    if (!sender || !markerId) {
      throw new Error(`Invalid parameter ${msg}`);
    }

    await detach(sender, markerId);
  } catch (e) {
    if (msg.sender) {
      sendError(msg.sender, e);
    }
  }
}

export async function onDisconnect(this: SocketMetadata, reason: string) {
  detach(this.id, this.markerId);
  console.log(`disconnected with ${reason}`);
}

export async function onPushSignal(msg: WebRTCMessage) {
  try {
    console.log(`signal = ${msg}`);
    if (msg.sender && msg.receiver) {
      const sendTo = getMemberAddr(msg);
      await cache.pushIntoArray(sendTo, msg.data);
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

export async function onPreSignal(msg: WebRTCMessage) {
  try {
    console.log('presignaling');
    unicast(msg);
  } catch (e) {
    console.log(e);
  }
}

/** Note 단위로 수정/삭제/생성 -> 추후, redis의 hash를 이용해 필드 단위로 접근하도록 변경할 수 있음. */
export async function refreshNote(msg: NoteMessage) {
  broadcast(msg);
}

export async function onCreateNote(msg: NoteMessage) {
  const id = getNoteId(msg);
  cache.set(id, JSON.stringify(msg));
  refreshNote(msg);
}

export async function onUpdateNote(msg: NoteMessage) {
  const id = getNoteId(msg);
  const exists = await cache.exists(id);
  if (exists) {
    cache.set(id, JSON.stringify(msg));
    refreshNote(msg);
  }
}

export async function onDeleteNote(msg: NoteMessage) {
  const id = getNoteId(msg);
  const exists = await cache.exists(id);
  if (exists) {
    cache.del(id);
    // refreshNote()
  }
}

// test 필요
export async function retrieveNote(this: SocketMetadata) {
  const pattern = getPattern(this.markerId);
  const noteStrings = await cache.pget(pattern);
  const notes: NoteMessage[] = [];
  noteStrings.forEach((noteString) => {
    notes.push(JSON.parse(noteString));
  });
  const ret: NoteMessageArray = {
    markerId: this.markerId,
    socketEvent: SocketEvent.REFRESH_NOTE,
    notes,
  };
  broadcast(ret);
}


