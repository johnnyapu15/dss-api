/* eslint-disable no-unused-vars */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
/* eslint-disable no-undef */
// with { "type": "module" } in your package.json
// import { createServer } from 'http';
// import { io as Client } from 'socket.io-client';
// import { Server } from 'socket.io';
// import { assert } from 'chai';

import { Socket } from 'socket.io';

// with { "type": "commonjs" } in your package.json
// const { createServer } = require("http");
// const { Server } = require("socket.io");
const { io } = require('socket.io-client');
const { assert } = require('chai');

interface Metadata {
  sender: string
  markerId: string
}

const TimeDict: Map<string, number[]> = new Map();
let TimeArr: number[] = [];

function getTime(msg: any, id?: string) {
  const { timestamp } = msg;
  TimeArr.push(Date.now() - timestamp);
}

function printTime() {
  let sum = 0;
  TimeArr.forEach((element) => {
    sum += element;
  });

  console.log(`avg: ${sum / TimeArr.length}ms\tsum: ${sum}ms\tcount: ${TimeArr.length}`);
}

function getSocket(sockets: Socket[], metadata: Metadata[]) {
  const socket = io('http://13.209.230.113:3000/drlab', {
    path: '/',
    transports: ['websocket'],
  });
  socket
    .on('INIT', (arg: any) => {
      sockets.push(socket);
      metadata.push(arg);
      const msg = {
        sender: arg.sender,
        markerId: arg.markerId,
      };
      socket.emit('ATTACH', msg);
      assert.equal(arg.markerId, 'drlab');
    });

  return socket;
}

const movementMessage = {
  userId: '',
  markerId: '',
  currentPosition: {
    x: 0.5, y: 0.5, z: 0.5,
  },
  moveVector: {
    x: 0.5, y: 0.5, z: 0.5,
  },
  status: 'MOVE',
  timestamp: 0,
}


describe('movements', () => {

  const SOCKET_NUMBER = 100;
  const sockets: Socket[] = []
  const metadatas: Metadata[] = []
  let clientSocket: Socket
  let metadata: Metadata;

  before((done) => {
    for (let i = 0; i < SOCKET_NUMBER; i += 1) {
      getSocket(sockets, metadatas);
    }
    done();
  });
  beforeEach((done) => {
    TimeArr = [];
    clientSocket = io('http://13.209.230.113:3000/drlab', {
      path: '/',
      transports: ['websocket'],
    });
    clientSocket
      .on('INIT', (arg) => {
        const msg = {
          sender: arg.sender,
          markerId: arg.markerId,
        };
        metadata = arg;
        clientSocket.emit('ATTACH', msg);
        assert.equal(arg.markerId, 'drlab');
        done();
      });
  });
  afterEach(() => {
    clientSocket.disconnect();
  });

  after(() => {
    sockets.forEach((socket) => {
      socket.disconnect();
    });
  });

  it('one movement', (done) => {
    clientSocket.once('REFRESH_MOVEMENT', (got: any) => {
      getTime(got.movement);
      done();
      printTime();
    });
    const msg = movementMessage;
    msg.userId = metadata.sender;
    msg.markerId = metadata.markerId;
    msg.timestamp = Date.now();
    clientSocket.emit('UPDATE_MOVEMENT', msg);
  });

  // it('100 movements with 10 socket emit', (done) => {
  //   clientSocket.on('REFRESH_MOVEMENT', (got: any) => {
  //     if (got.userId === metadatas[0].sender) {
  //       getTime(got.movement);
  //     }
  //     if (TimeArr.length === 100) { done(); printTime(); }
  //   });
  //   async function emit(i: number) {
  //     const index = i % SOCKET_NUMBER;
  //     const msg = JSON.parse(JSON.stringify(movementMessage));
  //     msg.userId = metadatas[index].sender;
  //     msg.markerId = metadata.markerId;
  //     msg.currentPosition.x = i;
  //     msg.timestamp = Date.now();
  //     sockets.forEach((socket) => {
  //       socket.emit('UPDATE_MOVEMENT', msg);
  //     });
  //   }
  //   for (let i = 0; i < 100; i += 1) emit(i);
  // });

  // it('1000 movements with 10 socket emit', (done) => {
  //   clientSocket.on('REFRESH_MOVEMENT', (got: any) => {
  //     if (got.userId === metadatas[0].sender) {
  //       getTime(got.movement);
  //     }
  //     if (TimeArr.length === 1000) { done(); printTime(); }
  //   });
  //   async function emit(i: number) {
  //     const index = i % SOCKET_NUMBER;
  //     const msg = JSON.parse(JSON.stringify(movementMessage));
  //     msg.userId = metadatas[index].sender;
  //     msg.markerId = metadata.markerId;
  //     msg.currentPosition.x = i;
  //     msg.timestamp = Date.now();
  //     sockets.forEach((socket) => {
  //       socket.emit('UPDATE_MOVEMENT', msg);
  //     });
  //   }
  //   for (let i = 0; i < 1000; i += 1) emit(i);
  // });
  it(`3 seconds with ${SOCKET_NUMBER} sockets emit`, (done) => {
    const INTERVAL: number = 50; // 3000 / 16 * 10 = 1875
    const STARTTIME = Date.now();
    clientSocket.on('REFRESH_MOVEMENT', (got: any) => {
      getTime(got.movement);

      // eslint-disable-next-line no-mixed-operators
      if (Date.now() - STARTTIME > 3500) { done(); ids.forEach((id) => { clearInterval(id) }); printTime(); console.log(`ideal: ${(3500 / INTERVAL * SOCKET_NUMBER)}`) }
    });
    async function emit(this: { socket: Socket, metadata: { sender: string, markerId: string } }) {
      const msg = JSON.parse(JSON.stringify(movementMessage));
      msg.userId = this.metadata.sender;
      msg.markerId = metadata.markerId;
      msg.timestamp = Date.now();
      // eslint-disable-next-line no-unused-expressions
      msg.currentPosition = {
        x: 10 * (Math.random() - 0.5), y: 10 * (Math.random() - 0.5), z: 10 * (Math.random() - 0.5),
      };
      this.socket.emit('UPDATE_MOVEMENT', msg);
    }
    const ids: NodeJS.Timeout[] = [];
    sockets.forEach((socket) => {
      ids.push(setInterval(emit.bind({
        socket, metadata: metadatas[sockets.indexOf(socket)],
      }), INTERVAL));
    });
  }).timeout(10000);
});
