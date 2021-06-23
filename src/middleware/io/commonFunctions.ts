/* eslint-disable no-param-reassign */
import { v4 } from 'uuid';
import {
  MovementMessage,
  MovementMessageArray,
  NoteMessage, NoteMessageArray, RefreshMovement, RefreshNote, WebRTCMessage,
} from '.';
import cache from '../memstore';

export function generateUUID() {
  const rand = v4();
  return rand;
}

export function getMemberAddr(msg: WebRTCMessage) {
  if (msg.sender && msg.receiver) {
    return `${msg.sender}_to_${msg.receiver}`;
  }
  return '';
}

/**
 *
 * @param id if null, use random uuid.
 * @returns created id
 */
export async function allocID(markerId: string, id?: string) {
  // add into marker-room (set)
  if (id) {
    const isMember = await cache.sismember(markerId, id);
    if (isMember === 1) {
    // 이미 있음
      return undefined;
    }
  } else {
    id = generateUUID();
  }
  await cache.addIntoSet(id, markerId);
  return id;
}
export function generateRoomId(idA: string, idB: string) {
  // 단방향 소통용 room id
  return `${idA}_${idB}`;
}
export function getMarkerId(
  msg: WebRTCMessage |
    NoteMessage |
    RefreshNote |
    NoteMessageArray |
    MovementMessage |
    MovementMessageArray |
    RefreshMovement,
) {
  const id = msg.markerId;
  return cleanMarkerId(id);
}

export function cleanMarkerId(id:string) {
  return id.startsWith('/') ? id.substring(1) : id;
}

export function getNoteId(note: NoteMessage) {
  return `POSTIT_${getMarkerId(note)}_${note.userId}_${note.noteId}`;
}

export function getNotePattern(markerId: string) {
  return `POSTIT_${markerId}*`;
}
export function getMovementKey(markerId: string, userId: string) {
  return `MOVEMENT_${markerId}_${userId}`;
}
export function getMovementId(movement: MovementMessage) {
  return getMovementKey(getMarkerId(movement), movement.userId);
}

export function getMovementPattern(markerId: string) {
  return `MOVEMENT_${markerId}*`;
}
