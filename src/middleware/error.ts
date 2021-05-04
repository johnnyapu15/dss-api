import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

class HttpError extends Error {
    code: number
    constructor(code: number, message?: string) {
        super(message);
        this.name = 'HttpError';
        this.code = code;
    }
}

export class BadRequestError extends HttpError {
    constructor(msg?: string,) {
        super(400, msg);
        this.name = 'BadRequest';
    }
}

export class NotFoundError extends HttpError {
    constructor(msg?: string,) {
        super(404, msg);
        this.name = 'NotFound';
    }
}

export async function errorMiddleware(e: HttpError, req: Request, res: Response, next: NextFunction) {
    console.log(e);
    res.statusCode = e.code;
    res.end();
}