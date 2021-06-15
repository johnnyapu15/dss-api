import { v4 } from 'uuid';
import {
  MovementMessage,
  MovementMessageArray,
  NoteMessage, NoteMessageArray, RefreshMovement, RefreshNote, WebRTCMessage,
} from '.';

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
  // eslint-disable-next-line no-param-reassign
  if (!id) { id = generateUUID(); }

  // create empty signal placeholder (array)
  // await cache.pushIntoArray(id);
  // add into marker-room (set)
  // await cache.addIntoSet(id, markerId);
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
  return id.startsWith('/') ? id.substring(1) : id;
}

export function getNoteId(note: NoteMessage) {
  return `POSTIT_${getMarkerId(note)}_${note.userId}_${note.noteId}`;
}

export function getNotePattern(markerId: string) {
  return `POSTIT_${markerId}*`;
}

export function getMovementId(movement: MovementMessage) {
  return `MOVEMENT_${getMarkerId(movement)}_${movement.userId}`;
}

export function getMovementPattern(markerId: string) {
  return `MOVEMENT_${markerId}*`;
}
