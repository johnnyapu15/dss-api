import {Request, Response, NextFunction} from 'express';


import * as cache from './cache';
import * as auth from './auth';




export async function store (req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const data = req.body as string;

        cache.store(id, data);

        res.statusCode = 200;
        res.end();
    } catch(e) {
        next(e);
    }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        
        if (!_globalCache[id] || _globalCache[id].length === 0) {
            res.statusCode = 404;
            res.end();
        } else {
            const data = _globalCache[id].shift();

            res.statusCode = 200
            res.end(data);
        }
    } catch(e) {
        next(e);
    }
}