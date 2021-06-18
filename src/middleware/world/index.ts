/* eslint-disable no-unused-vars */
import { MovementMessage } from '../io';

/**
 * world 관련한 객체를
 * in-memory에서 구현.
 * 비동기 update & get이 가능해야 함.
 */

export interface WorldState {
    movementArray: MovementMessage[]
}
