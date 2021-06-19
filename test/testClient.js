"use strict";
/* eslint-disable no-unused-vars */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
/* eslint-disable no-undef */
// with { "type": "module" } in your package.json
// import { createServer } from 'http';
// import { io as Client } from 'socket.io-client';
// import { Server } from 'socket.io';
// import { assert } from 'chai';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// with { "type": "commonjs" } in your package.json
// const { createServer } = require("http");
// const { Server } = require("socket.io");
const { io } = require('socket.io-client');
const { assert } = require('chai');
const TimeDict = new Map();
let TimeArr = [];
function getTime(msg, id) {
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
function getSocket(sockets, metadata) {
    const socket = io('http://13.209.230.113:3000/drlab', {
        path: '/',
        transports: ['websocket'],
    });
    socket
        .on('INIT', (arg) => {
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
};
describe('movements', () => {
    const SOCKET_NUMBER = 10;
    const sockets = [];
    const metadatas = [];
    let clientSocket;
    let metadata;
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
    it('one movements', (done) => {
        clientSocket.once('REFRESH_MOVEMENT', (got) => {
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
    it('100 movements with random socket emit', (done) => {
        clientSocket.on('REFRESH_MOVEMENT', (got) => {
            getTime(got.movement);
            if (got.movement.currentPosition.x === 99) {
                done();
                printTime();
            }
        });
        function emit(i) {
            return __awaiter(this, void 0, void 0, function* () {
                const index = i % SOCKET_NUMBER;
                const msg = JSON.parse(JSON.stringify(movementMessage));
                msg.userId = metadatas[index].sender;
                msg.markerId = metadata.markerId;
                msg.currentPosition.x = i;
                msg.timestamp = Date.now();
                sockets[index].emit('UPDATE_MOVEMENT', msg);
            });
        }
        for (let i = 0; i < 100; i += 1)
            emit(i);
    });
    it('1000 movements with random socket emit', (done) => {
        clientSocket.on('REFRESH_MOVEMENT', (got) => {
            getTime(got.movement);
            if (got.movement.currentPosition.x === 999) {
                done();
                printTime();
            }
        });
        function emit(i) {
            return __awaiter(this, void 0, void 0, function* () {
                const index = i % SOCKET_NUMBER;
                const msg = JSON.parse(JSON.stringify(movementMessage));
                msg.userId = metadatas[index].sender;
                msg.markerId = metadata.markerId;
                msg.currentPosition.x = i;
                msg.timestamp = Date.now();
                sockets[index].emit('UPDATE_MOVEMENT', msg);
            });
        }
        for (let i = 0; i < 1000; i += 1)
            emit(i);
    });
    it('3 seconds with all socket emit', (done) => {
        const INTERVAL = 16; // 3000 / 16 * 10 = 1875
        const STARTTIME = Date.now();
        let sendingMsg = 0;
        clientSocket.on('REFRESH_MOVEMENT', (got) => {
            getTime(got.movement);
            if (Date.now() - STARTTIME > 3000) {
                done();
                ids.forEach((id) => { clearInterval(id); });
                printTime();
                console.log(`sended: ${sendingMsg}`);
            }
        });
        function emit() {
            return __awaiter(this, void 0, void 0, function* () {
                const msg = JSON.parse(JSON.stringify(movementMessage));
                msg.userId = this.metadata.sender;
                msg.markerId = metadata.markerId;
                msg.timestamp = Date.now();
                this.socket.emit('UPDATE_MOVEMENT', msg);
                sendingMsg += 1;
            });
        }
        const ids = [];
        sockets.forEach((socket) => {
            ids.push(setInterval(emit.bind({
                socket, metadata: metadatas[sockets.indexOf(socket)],
            }), INTERVAL));
        });
    }).timeout(10000);
});
//# sourceMappingURL=testClient.js.map