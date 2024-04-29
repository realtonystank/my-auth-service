import { Request, Response } from 'express';
export class AuthController {
    register(req: Request, res: Response) {
        return res.status(201).json();
    }
}
