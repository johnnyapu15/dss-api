import { v4 } from 'uuid';
import { SocketMessage } from '../io';

export function generateUUID() {
  const rand = v4();
  return rand;
}

export function getMemberAddr(msg: SocketMessage) {
  if (msg.sender && msg.receiver) {
    return `${msg.sender}_to_${msg.receiver}`;
  } 
  return '';
  
}
