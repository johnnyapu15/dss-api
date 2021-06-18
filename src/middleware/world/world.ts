import { Socket } from 'socket.io';
import { WorldState } from '.';
import { MovementMessage, MovementMessageArray, SocketEvent } from '../io';

export default class World {
  state: WorldState

  stateIdDict: Map<string, number>

  socket: Socket

  constructor(socket: Socket) {
    this.state = {
      movementArray: [],
    };
    this.stateIdDict = new Map<string, number>();
    this.socket = socket;
  }

  async getWorld(): Promise<WorldState> {
    return this.state;
  }

  async getMovements(): Promise<MovementMessage[]> {
    return this.state.movementArray;
  }

  public async updateMovement(movement: MovementMessage) {
    const id = movement.userId;
    if (!this.stateIdDict.has(id)) {
      this.stateIdDict.set(id, this.state.movementArray.length);
    }
    this.state.movementArray.push(
      movement,
    );
  }

  broadcastWorld(rate: number) {
    const msg = {
      socketEvent: SocketEvent.RETRIEVE_MOVEMENT,
      markerId: this.socket
    } as MovementMessageArray
    this.socket.emit(SocketEvent.RETRIEVE_MOVEMENT, )
  }
}
