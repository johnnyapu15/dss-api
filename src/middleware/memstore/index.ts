import {Request, Response, NextFunction} from 'express';
import { generateUUID } from './functions';
import NodeCache from 'node-cache';
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

            res.json({id});
        } catch(e) {
            next(e);
        }
    },
};

export default memstore;