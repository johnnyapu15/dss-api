import {Request, Response, NextFunction} from 'express';
import { generateUUID } from './functions';

const _globalCache: {[key:string]: string[]} = {};

const memstore = {
    getUUID: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = generateUUID();
            res.json({id});
        } catch(e) {
            next(e);
        }
    },
    store: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            
            if (!_globalCache[id]) {
                _globalCache[id] = [];
            }

            _globalCache[id].push(req.body as string);

            res.statusCode = 200;
            res.end();
        } catch(e) {
            next(e);
        }
    },
};

export default memstore;