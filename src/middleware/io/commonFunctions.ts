import { v4 } from 'uuid';
import {
  NoteMessage, NoteMessageArray, RefreshNote, WebRTCMessage,
} from '.';
import { cache } from '../memstore';

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
export async function allocID(id?: string) {
  // eslint-disable-next-line no-param-reassign
  if (!id) { id = generateUUID(); }

  // create empty signal placeholder (array)
  await cache.pushIntoArray(id);
  return id;
}

export function getMarkerId(msg: WebRTCMessage | NoteMessage | RefreshNote | NoteMessageArray) {
  const id = msg.markerId;
  return id.startsWith('/') ? id.substring(1) : id;
}

export function getNoteId(note: NoteMessage) {
  return `POSTIT_${getMarkerId(note)}_${note.userId}_${note.noteId}`;
}

export function getPattern(markerId: string) {
  return `POSTIT_${markerId}*`;
}
