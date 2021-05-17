import { v4 } from 'uuid';

export function generateUUID() {
  const rand = v4();
  return rand;
}

export function getMemberAddr(id:string, roomId:string) {
  return `${roomId}_${id}`;
}
