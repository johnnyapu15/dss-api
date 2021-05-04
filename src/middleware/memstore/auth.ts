import { generateUUID } from './commonFunctions';
import {Request, Response, NextFunction} from 'express';

export async function getUUID (req: Request, res: Response, next: NextFunction) {
    try {
        const id = generateUUID();
        res.json({id});
    } catch(e) {
        next(e);
    }
}