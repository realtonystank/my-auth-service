import express, {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from 'express';
import authenticate from '../middlewares/authenticate';
import { canAccess } from '../middlewares/canAccess';
import { Roles } from '../constants';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import validateUser from '../validators/user-validator';
import { CreateUserRequest } from '../types';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]) as RequestHandler,
    validateUser,
    (req: Request, res: Response, next: NextFunction) =>
        userController.create(req as CreateUserRequest, res, next),
);

router.get(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]) as RequestHandler,
    (req, res, next) => userController.fetchAllUsers(req, res, next),
);
router.get('/:id', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    userController.fetchOneUser(req, res, next),
);

router.patch(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    validateUser,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateUserById(req as CreateUserRequest, res, next),
);

router.delete(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    (req, res, next) => userController.deleteUserById(req, res, next),
);

export default router;
