import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { Roles } from '../constants';
import createHttpError from 'http-errors';

export class UserController {
    constructor(private userService: UserService) {}

    async create(req: Request, res: Response, next: NextFunction) {
        const { firstName, lastName, email, password } = req.body;

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role: Roles.MANAGER,
            });

            return res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }
    async fetchAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.fetchAll();
            return res.json({ users });
        } catch (err) {
            next(err);
            return;
        }
    }
    async fetchOneUser(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        if (isNaN(Number(id))) {
            const error = createHttpError(400, 'Possibly incorrect id');
            next(error);
            return;
        }

        try {
            const user = await this.userService.findById(Number(id));

            return res.json({ user });
        } catch (err) {
            next(err);
            return;
        }
    }
    async deleteUserById(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        if (isNaN(Number(id))) {
            const error = createHttpError(400, 'Possibly incorrect id');
            next(error);
            return;
        }

        try {
            await this.userService.deleteById(Number(id));

            return res.status(204).send();
        } catch (err) {
            next(err);
            return;
        }
    }
}
