import { generateUUID } from './commonFunctions';
import {Request, Response, NextFunction} from 'express';
import { pushSignal } from './cache';

export async function generateIDMW (req: Request, res: Response, next: NextFunction) {
    try {
        const id = generateID();
        res.json({id});
    } catch(e) {
        next(e);
    }
}


export async function generateID() {
    const id = generateUUID();
    await pushSignal(id, ); // create empty array
    return id;
}