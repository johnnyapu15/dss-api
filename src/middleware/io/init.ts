import { Express } from 'express';
import { Server } from 'socket.io';
import { Server as httpServer } from 'http';
import { generateID } from '../memstore/auth';
import { Marker, SocketIOMsgEvent } from '.';
import { attachIntoMarker, detachFromMarker } from '../memstore/cache';



export function initSocketIO(server: httpServer) {
    const io = new Server().listen(server);
    io.on('connection', (async socket => {
        const id = socket.id;

        socket
            .on(SocketIOMsgEvent.ATTACH, async (marker: Marker) => {
                await socket.join(marker.id);
                //const members = await attachIntoMarker(socket.id, marker.id); // setting marker for database
                
                socket.to(marker.id).emit(SocketIOMsgEvent.ATTACH, id);
            })
            .on(SocketIOMsgEvent.DETACH, async (marker: Marker) => {
                await socket.leave(marker.id);
                //await detachFromMarker(socket.id, marker.id);
            })
            // 
            // 
    }))
}
