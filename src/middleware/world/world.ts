import { WorldState } from '.';
import { MovementMessage } from '../io';


export default class World {
    state: WorldState

    stateIdDict: Map<string, number>

    constructor() {
      this.state = {
        movements: [],
      };
      this.stateIdDict = new Map<string, number>();
    }

    public updateMovement(movement:MovementMessage) {
      const id = movement.userId;
      if (!this.stateIdDict.has(id)) {
          this.stateIdDict.set(id, this.state.movements.length);
      }
      this.state.movements.push(
          movement,
      );
    }
}