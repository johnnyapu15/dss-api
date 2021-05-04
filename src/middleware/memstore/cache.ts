import { BadRequestError, NotFoundError } from "../error";
import { Request, Response, NextFunction } from 'express';


/**
 * marker id: string  => users: Set<string>
 * 
 * ${user1}_${user2}: string => SDN for webRTC: string[]
 * 
 */
type MarkerData = Set<string>;
type SignalData = string[];


const _globalCache: { [key: string]: MarkerData | SignalData } = {};


export async function attachIntoMarker(id: string, marker_id: string) {
    try {
        let isInit = false;
        if (!_globalCache[id]) {
            _globalCache[id] = new Set<string>();
            isInit = true;
        }
        if (!id) {
            throw new BadRequestError('Invalid id');
        }
        const cache = _globalCache[id] as MarkerData;
        cache.add(id);
        if (!isInit)
            return cache;
    } catch (e) {
        throw (e);
    }
}

export async function detachFromMarker(id: string, marker_id: string) {
    try {
        const got = _globalCache[id] as MarkerData;
        if (!got || !got.has(id)) {
            throw new NotFoundError('Invalid id');
        } else {
            got.delete(id);
        }
    } catch (e) {
        throw e;
    }
}



export async function pushMW(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
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
        const id = req.params.id;
        console.log(id)
        const got = await popSignal(id);
        res.statusCode = 200
        res.end(got);

    } catch (e) {
        next(e);
    }
}



export async function pushSignal(id: string, data?: string) {
    try {
        if (!_globalCache[id]) {
            _globalCache[id] = [];
        }
        if (data) {
            const cache = _globalCache[id] as SignalData;
            cache.push(data);
        }
        return 0;
    } catch (e) {
        throw (e);
    }
}


export async function popSignal(id: string) {
    try {
        const got = _globalCache[id] as SignalData;
        if (!got || got.length === 0) {
            throw new NotFoundError('Invalid id');
        } else {
            const data = got.shift();
            return data;
        }
    } catch (e) {
        throw e;
    }
}