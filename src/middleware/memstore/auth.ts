import { generateUUID } from './commonFunctions';
import { Request, Response, NextFunction } from 'express';
import { addIntoSet, deleteFromSet, deleteKey, popFromArray, pushIntoArray } from './cache';
import { SocketMessage, SocketEvent } from '../io';

/**
 * marker id: string  => users: Set<string>
 * 
 * ${user1}_${user2}: string => SDN for webRTC: string[]
 * 
 */
type MarkerData = Set<string>;
type SignalData = string[];


export async function generateIDMW(req: Request, res: Response, next: NextFunction) {
    try {
        const id = allocID();
        res.json({ id });
    } catch (e) {
        next(e);
    }
}


export async function allocID(id? :string) {
    if (!id)
        id = generateUUID();

    // create empty signal placeholder (array)
    await pushSignal(id);
    return id;
}


export async function attachIntoMarker(id: string, markerId: string) {
    /** publish event to redis */
    try {
        const setData = await addIntoSet(id, markerId)
        const roomData = {
            event: SocketEvent.ATTACH,
            members: setData.set,
            markerId,
            id,           
        } as SocketMessage
        return roomData
    } catch (e) {
        throw (e);
    }
}

export async function detachFromMarker(id: string, markerId: string) {
    try {
        await deleteSignalHolder(id)
        const setData = await deleteFromSet(id, markerId)
        const roomData = {
            event: SocketEvent.DETACH,
            members: setData.set,
            markerId,
            id,   
        } as SocketMessage
        return roomData
    } catch (e) {
        throw e;
    }
}

export async function deleteSignalHolder(id: string) {
    try {
        return deleteKey(id)
    } catch (e) {
        throw (e);
    }
}

export async function pushSignal(id: string, data?: string) {
    try {
        return pushIntoArray(id, data)
    } catch (e) {
        throw (e);
    }
}


export async function popSignal(id: string) {
    try {
        return popFromArray(id)
    } catch (e) {
        throw e;
    }
}

export async function pushMW(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.memberAddr;
        const data = req.body as string;

        pushSignal(id, data);

        res.statusCode = 200;
        res.end();
    } catch (e) {
        next(e);
    }
}

export async function popMW(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.memberAddr;
        const got = await popSignal(id);
        res.statusCode = 200
        res.end(got);

    } catch (e) {
        next(e);
    }
}